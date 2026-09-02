// ============================================================
// 勤怠・店舗管理システム バックエンド (Supabase Edge Function)
// 旧 Google Apps Script (Code.gs) の全アクションを移植。
// フロントは { action, ...payload } を POST し JSON を受け取る —
// この契約は GAS 時代と完全互換。
//
// データベース: Supabase Postgres (テーブル定義は supabase/migrations/ 参照)
// 日付/時刻は text で保持:
//   date = "yyyy-MM-dd" / time = "HH:mm" / timestamp = ISO +07:00
// ============================================================
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// ----------------------------------------------------------------
// 共通ヘルパー
// ----------------------------------------------------------------
// Vietnam は UTC+7 固定 (DST 無し) なので手動シフトで安全に変換できる。
const VN_OFFSET_MS = 7 * 3600 * 1000;

function pad(n: number): string {
  return n < 10 ? "0" + n : "" + n;
}

function fmtDateVN(d: Date): string {
  const s = new Date(d.getTime() + VN_OFFSET_MS);
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
}

function fmtIsoVN(d: Date): string {
  const s = new Date(d.getTime() + VN_OFFSET_MS);
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}` +
    `T${pad(s.getUTCHours())}:${pad(s.getUTCMinutes())}:${pad(s.getUTCSeconds())}+07:00`;
}

function todayStr(): string {
  return fmtDateVN(new Date());
}

function nowIso(): string {
  return fmtIsoVN(new Date());
}

function uuid(): string {
  return crypto.randomUUID();
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function _toNum(v: unknown): number {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return isNaN(v) ? 0 : v;
  const n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function str(v: unknown): string {
  return v === null || v === undefined ? "" : String(v);
}

// "yyyy-MM-dd" + "HH:mm[:ss]" → ISO +07:00 (キオスクはベトナム現地時刻で入力)
function _composeTs(date: string, time: string): string {
  let t = String(time || "");
  if (/^\d{2}:\d{2}$/.test(t)) t = t + ":00";
  if (!/^\d{2}:\d{2}:\d{2}$/.test(t)) return "";
  const d = new Date(`${date}T${t}+07:00`);
  if (isNaN(d.getTime())) return "";
  return `${date}T${t}+07:00`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function ymStr(year: number, month: number): string {
  return `${year}-${pad(month)}`;
}

function prevYmStr(year: number, month: number): string {
  let py = year, pm = month - 1;
  if (pm < 1) { pm = 12; py -= 1; }
  return ymStr(py, pm);
}

// ----------------------------------------------------------------
// DB ヘルパー
// ----------------------------------------------------------------
type Row = Record<string, unknown>;

// PostgREST は 1 リクエスト最大 1000 行なのでページングして全件取得する。
// build でフィルタを追加できる (順序は id で安定させる)。
async function fetchAll(
  table: string,
  // deno-lint-ignore no-explicit-any
  build?: (q: any) => any,
): Promise<Row[]> {
  const out: Row[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    let q: any = supabase.from(table).select("*").order("id").range(from, from + page - 1);
    if (build) q = build(q);
    const { data, error } = await q;
    if (error) throw new Error(`${table}: ${error.message}`);
    out.push(...(data as Row[]));
    if ((data as Row[]).length < page) break;
  }
  return out;
}

async function insertRow(table: string, row: Row): Promise<void> {
  const { error } = await supabase.from(table).insert(row);
  if (error) throw new Error(`${table} insert: ${error.message}`);
}

async function updateRow(table: string, id: string, patch: Row): Promise<void> {
  const { error } = await supabase.from(table).update(patch).eq("id", id);
  if (error) throw new Error(`${table} update: ${error.message}`);
}

async function deleteById(table: string, id: string) {
  if (!id) return { success: false, message: "Missing id" };
  const { data, error } = await supabase.from(table).delete().eq("id", id).select("id");
  if (error) throw new Error(`${table} delete: ${error.message}`);
  if (!data || data.length === 0) return { success: false, message: "Not found" };
  return { success: true };
}

async function findUserById(userId: string): Promise<Row | null> {
  if (!userId) return null;
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).maybeSingle();
  if (error) throw new Error("users: " + error.message);
  return data;
}

// ----------------------------------------------------------------
// User: register / login / list / delete
// ----------------------------------------------------------------
async function registerUser(body: Row) {
  const name = str(body.name).trim();
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);
  let role = str(body.role).trim();

  if (!name) return { success: false, message: "Name required" };
  if (password && password.length < 6) {
    return { success: false, message: "Password too short" };
  }

  const validRoles = ["admin", "employee", "parttime"];
  if (!role || validRoles.indexOf(role) === -1) role = "employee";

  const validGenders = ["male", "female", "other", ""];
  let gender = str(body.gender).trim();
  if (validGenders.indexOf(gender) === -1) gender = "";

  if (email) {
    const users = await fetchAll("users");
    if (users.some((u) => str(u.email).toLowerCase() === email)) {
      return { success: false, code: "EMAIL_EXISTS", message: "Email already registered" };
    }
  }

  const id = uuid();
  const passwordHash = password ? await hashPassword(password) : "";

  await insertRow("users", {
    id,
    name,
    email,
    passwordHash,
    createdAt: nowIso(),
    role,
    phone: str(body.phone).trim(),
    birthDate: str(body.birthDate).trim(),
    gender,
    idNumber: str(body.idNumber).trim(),
    address: str(body.address).trim(),
    hireDate: str(body.hireDate).trim(),
    emergencyContact: str(body.emergencyContact).trim(),
    bankName: str(body.bankName).trim(),
    bankBranch: str(body.bankBranch).trim(),
    bankAccount: str(body.bankAccount).trim(),
    hourlyRate: _toNum(body.hourlyRate),
    dailyRate: _toNum(body.dailyRate),
    store: str(body.store).trim(),
  });

  return { success: true, user: { id, name, email, role } };
}

async function listUsers(_body: Row) {
  const users = await fetchAll("users");
  const filtered = users.filter((u) => str(u.id).trim() !== "" || str(u.name).trim() !== "");
  filtered.sort((a, b) => {
    const na = str(a.name).trim().toLowerCase();
    const nb = str(b.name).trim().toLowerCase();
    return na < nb ? -1 : na > nb ? 1 : 0;
  });
  return {
    success: true,
    users: filtered.map((u) => ({
      id: str(u.id).trim(),
      name: str(u.name).trim(),
      email: str(u.email).trim(),
      role: str(u.role).trim(),
      phone: str(u.phone).trim(),
      store: str(u.store).trim(),
      hourlyRate: _toNum(u.hourlyRate),
      dailyRate: _toNum(u.dailyRate),
      hireDate: str(u.hireDate).trim(),
    })),
  };
}

async function deleteUser(body: Row) {
  return await deleteById("users", str(body.id));
}

// マスタ画面の編集モーダル用: 1ユーザーの全プロフィールを返す (passwordHash は除く)
async function getUser(body: Row) {
  const id = str(body.id);
  if (!id) return { success: false, message: "Missing id" };
  const u = await findUserById(id);
  if (!u) return { success: false, message: "Not found" };
  return {
    success: true,
    user: {
      id: u.id,
      name: str(u.name),
      email: str(u.email),
      role: str(u.role),
      phone: str(u.phone),
      birthDate: str(u.birthDate),
      gender: str(u.gender),
      idNumber: str(u.idNumber),
      address: str(u.address),
      hireDate: str(u.hireDate),
      emergencyContact: str(u.emergencyContact),
      bankName: str(u.bankName),
      bankBranch: str(u.bankBranch),
      bankAccount: str(u.bankAccount),
      hourlyRate: _toNum(u.hourlyRate),
      dailyRate: _toNum(u.dailyRate),
      store: str(u.store),
    },
  };
}

// ユーザー情報の更新。送られてきたフィールドだけを部分更新する。
async function updateUser(body: Row) {
  const id = str(body.id);
  if (!id) return { success: false, message: "Missing id" };
  const user = await findUserById(id);
  if (!user) return { success: false, message: "Not found" };

  const patch: Row = {};

  if (body.name !== undefined) {
    const name = str(body.name).trim();
    if (!name) return { success: false, message: "Name required" };
    patch.name = name;
  }

  if (body.email !== undefined) {
    const email = str(body.email).trim().toLowerCase();
    if (email && email !== str(user.email).toLowerCase()) {
      const users = await fetchAll("users");
      if (users.some((u) => str(u.id) !== id && str(u.email).toLowerCase() === email)) {
        return { success: false, code: "EMAIL_EXISTS", message: "Email already registered" };
      }
    }
    patch.email = email;
  }

  if (body.role !== undefined) {
    const role = str(body.role).trim();
    patch.role = ["admin", "employee", "parttime"].includes(role) ? role : "employee";
  }

  if (body.gender !== undefined) {
    const gender = str(body.gender).trim();
    patch.gender = ["male", "female", "other", ""].includes(gender) ? gender : "";
  }

  for (const k of [
    "phone", "birthDate", "idNumber", "address", "hireDate",
    "emergencyContact", "bankName", "bankBranch", "bankAccount", "store",
  ]) {
    if (body[k] !== undefined) patch[k] = str(body[k]).trim();
  }
  if (body.hourlyRate !== undefined) patch.hourlyRate = _toNum(body.hourlyRate);
  if (body.dailyRate !== undefined) patch.dailyRate = _toNum(body.dailyRate);

  await updateRow("users", id, patch);
  return { success: true };
}

async function loginUser(body: Row) {
  const email = str(body.email).trim().toLowerCase();
  const password = str(body.password);
  if (!email || !password) return { success: false, message: "Missing fields" };

  const hash = await hashPassword(password);
  const users = await fetchAll("users");
  for (const u of users) {
    if (str(u.email).toLowerCase() === email && str(u.passwordHash) === hash) {
      return {
        success: true,
        user: { id: u.id, name: u.name, email: u.email, role: u.role || "user" },
      };
    }
  }
  return { success: false, message: "Invalid credentials" };
}

// ----------------------------------------------------------------
// Attendance: record + status
// ----------------------------------------------------------------
// ユーザーの「現在のセッション」のイベント群を返す (GAS 版と同一仕様):
//  - 最後の clock_out より後のイベントがあればそれ (進行中シフト。退勤忘れ復帰用)
//  - なければ今日のイベント
async function getSessionLogs(userId: string): Promise<Row[]> {
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("userId", userId)
    .order("timestamp", { ascending: false })
    .limit(400);
  if (error) throw new Error("attendance: " + error.message);
  const userEvents = (data as Row[]).slice().reverse();

  let startIdx = 0;
  for (let i = userEvents.length - 1; i >= 0; i--) {
    if (str(userEvents[i].type) === "clock_out") {
      startIdx = i + 1;
      break;
    }
  }
  const ongoing = userEvents.slice(startIdx);
  if (ongoing.length > 0) return ongoing;

  const today = todayStr();
  return userEvents.filter((r) => str(r.date) === today);
}

function deriveStatus(todayLogs: Row[]): string {
  if (!todayLogs.length) return "out";
  const last = todayLogs[todayLogs.length - 1];
  switch (str(last.type)) {
    case "clock_in":
    case "break_end":
      return "in";
    case "break_start":
      return "break";
    case "clock_out":
      return "finished";
    default:
      return "out";
  }
}

function isAllowedTransition(currentStatus: string, type: string): boolean {
  switch (type) {
    case "clock_in":
      return currentStatus === "out" || currentStatus === "finished";
    case "clock_out":
      return currentStatus === "in";
    case "break_start":
      return currentStatus === "in";
    case "break_end":
      return currentStatus === "break";
  }
  return false;
}

function stripRow(r: Row) {
  return {
    id: r.id,
    userId: r.userId,
    type: r.type,
    timestamp: str(r.timestamp),
    date: str(r.date),
    store: str(r.store),
  };
}

const VALID_PUNCH_TYPES = ["clock_in", "clock_out", "break_start", "break_end"];

async function recordAttendance(body: Row) {
  const userId = str(body.userId);
  const type = str(body.type);
  if (!userId || !type) return { success: false, message: "Missing fields" };
  if (VALID_PUNCH_TYPES.indexOf(type) === -1) return { success: false, message: "Invalid type" };

  const todayLogs = await getSessionLogs(userId);
  const status = deriveStatus(todayLogs);
  if (!isAllowedTransition(status, type)) {
    return {
      success: false,
      code: "INVALID_STATE",
      message: `Invalid transition: ${status} -> ${type}`,
      status,
      todayLog: todayLogs.map(stripRow),
    };
  }

  // 名前/役職はクライアント優先、無ければ users から補完。
  let name = body.name !== undefined ? str(body.name) : "";
  let role = body.role !== undefined ? str(body.role) : "";
  let store = str(body.store).trim();
  if ((!name && !role) || !store) {
    const user = await findUserById(userId);
    if (user) {
      if (!name && !role) {
        name = str(user.name);
        role = str(user.role);
      }
      if (!store) store = str(user.store).trim();
    }
  }

  const newId = uuid();
  const newTs = nowIso();
  const newDate = todayStr();
  await insertRow("attendance", {
    id: newId, userId, type, timestamp: newTs, date: newDate, name, role, store,
  });

  const newEvent: Row = { id: newId, userId, type, timestamp: newTs, date: newDate, store };
  let refreshed: Row[];
  if (type === "clock_in" && status === "finished") {
    refreshed = [newEvent];
  } else {
    refreshed = todayLogs.concat([newEvent]);
  }

  return {
    success: true,
    status: deriveStatus(refreshed),
    todayLog: refreshed.map(stripRow),
  };
}

async function getStatus(body: Row) {
  const userId = str(body.userId);
  if (!userId) return { success: false, message: "Missing userId" };
  const todayLogs = await getSessionLogs(userId);
  return {
    success: true,
    status: deriveStatus(todayLogs),
    todayLog: todayLogs.map(stripRow),
  };
}

// ----------------------------------------------------------------
// Attendance management (list / add / update / delete)
// ----------------------------------------------------------------
async function listAttendance(body: Row) {
  const userId = str(body.userId);
  const dateFrom = str(body.dateFrom);
  const dateTo = str(body.dateTo);
  const store = str(body.store);

  const rows = await fetchAll("attendance", (q) => {
    if (userId) q = q.eq("userId", userId);
    if (store) q = q.eq("store", store);
    if (dateFrom) q = q.gte("date", dateFrom);
    if (dateTo) q = q.lte("date", dateTo);
    return q;
  });

  rows.sort((a, b) => str(b.timestamp).localeCompare(str(a.timestamp))); // newest first
  return {
    success: true,
    records: rows.map((r) => ({
      id: str(r.id),
      userId: str(r.userId),
      name: str(r.name),
      role: str(r.role),
      type: str(r.type),
      timestamp: str(r.timestamp),
      date: str(r.date),
      store: str(r.store),
    })),
  };
}

async function addAttendance(body: Row) {
  const userId = str(body.userId);
  const date = str(body.date);
  const time = str(body.time);
  const type = str(body.type);
  if (!userId || !date || !time || !type) return { success: false, message: "Missing fields" };
  if (VALID_PUNCH_TYPES.indexOf(type) === -1) return { success: false, message: "Invalid type" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  const ts = _composeTs(date, time);
  if (!ts) return { success: false, message: "Invalid time" };

  const user = await findUserById(userId);
  const name = user ? str(user.name) : "";
  const role = user ? str(user.role) : "";
  let store = str(body.store).trim();
  if (!store && user) store = str(user.store).trim();
  const newId = uuid();
  await insertRow("attendance", {
    id: newId, userId, type, timestamp: ts, date, name, role, store,
  });
  return { success: true, id: newId };
}

async function updateAttendance(body: Row) {
  const id = str(body.id);
  const userId = str(body.userId);
  const date = str(body.date);
  const time = str(body.time);
  const type = str(body.type);
  if (!id || !userId || !date || !time || !type) return { success: false, message: "Missing fields" };
  if (VALID_PUNCH_TYPES.indexOf(type) === -1) return { success: false, message: "Invalid type" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  const ts = _composeTs(date, time);
  if (!ts) return { success: false, message: "Invalid time" };

  const { data, error } = await supabase.from("attendance").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("attendance: " + error.message);
  if (!data) return { success: false, message: "Not found" };

  const user = await findUserById(userId);
  const name = user ? str(user.name) : str(data.name);
  const role = user ? str(user.role) : str(data.role);
  const store = body.store !== undefined ? str(body.store).trim() : str(data.store);
  await updateRow("attendance", id, { userId, type, timestamp: ts, date, name, role, store });
  return { success: true };
}

async function deleteAttendance(body: Row) {
  return await deleteById("attendance", str(body.id));
}

// ----------------------------------------------------------------
// Shifts: register / list / delete
// ----------------------------------------------------------------
async function registerShift(body: Row) {
  const userId = str(body.userId);
  const date = str(body.date);
  const startTime = str(body.startTime);
  const endTime = str(body.endTime);
  const note = str(body.note);

  if (!userId || !date || !startTime || !endTime) {
    return { success: false, message: "Missing fields" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return { success: false, message: "Invalid time" };
  }

  const user = await findUserById(userId);
  if (!user) return { success: false, message: "User not found" };

  const store = str(body.store).trim() || str(user.store).trim();
  await insertRow("shifts", {
    id: uuid(),
    userId,
    userName: str(user.name),
    date,
    startTime,
    endTime,
    note,
    createdAt: nowIso(),
    store,
    position: str(body.position).trim(),
  });
  return { success: true };
}

async function listShifts(body: Row) {
  const filterUserId = str(body.filterUserId);
  const year = parseInt(str(body.year), 10);
  const month = parseInt(str(body.month), 10);
  const dateFrom = str(body.dateFrom);
  const dateTo = str(body.dateTo);
  const filterStore = str(body.filterStore);

  const prefix = year && month ? ymStr(year, month) : "";

  const rows = await fetchAll("shifts", (q) => {
    if (prefix) q = q.gte("date", prefix + "-01").lte("date", prefix + "-31");
    if (dateFrom) q = q.gte("date", dateFrom);
    if (dateTo) q = q.lte("date", dateTo);
    if (filterUserId) q = q.eq("userId", filterUserId);
    if (filterStore) q = q.eq("store", filterStore);
    return q;
  });

  rows.sort((a, b) => {
    const da = str(a.date), db = str(b.date);
    if (da !== db) return da < db ? -1 : 1;
    const sa = str(a.startTime), sb = str(b.startTime);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });

  return {
    success: true,
    shifts: rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      date: str(r.date),
      startTime: str(r.startTime),
      endTime: str(r.endTime),
      note: r.note,
      store: str(r.store),
      position: str(r.position),
    })),
  };
}

// ----------------------------------------------------------------
// Positions (シフトのポジションマスタ) + 日別売上予算
// ----------------------------------------------------------------
async function listPositions(body: Row) {
  const store = str(body.store);
  const rows = await fetchAll("positions", (q) => (store ? q.eq("store", store) : q));
  rows.sort((a, b) => {
    const oa = _toNum(a.sortOrder), ob = _toNum(b.sortOrder);
    if (oa !== ob) return oa - ob;
    return str(a.name).localeCompare(str(b.name));
  });
  return {
    success: true,
    positions: rows.map((r) => ({
      id: r.id,
      store: str(r.store),
      name: str(r.name),
      color: str(r.color) || "#64748b",
      modelHours: _toNum(r.modelHours),
      sortOrder: _toNum(r.sortOrder),
    })),
  };
}

async function registerPosition(body: Row) {
  const store = str(body.store).trim();
  const name = str(body.name).trim();
  if (!store || !name) return { success: false, message: "Missing fields" };
  const rows = await fetchAll("positions", (q) => q.eq("store", store));
  const lower = name.toLowerCase();
  if (rows.some((r) => str(r.name).trim().toLowerCase() === lower)) {
    return { success: false, code: "DUPLICATE", message: "Position already exists" };
  }
  const id = uuid();
  await insertRow("positions", {
    id,
    store,
    name,
    color: str(body.color) || "#64748b",
    modelHours: _toNum(body.modelHours),
    sortOrder: body.sortOrder !== undefined ? _toNum(body.sortOrder) : (rows.length + 1) * 10,
    createdAt: nowIso(),
  });
  return { success: true, id };
}

async function updatePosition(body: Row) {
  const id = str(body.id);
  if (!id) return { success: false, message: "Missing id" };
  const patch: Row = {};
  if (body.name !== undefined) {
    const name = str(body.name).trim();
    if (!name) return { success: false, message: "Name required" };
    patch.name = name;
  }
  if (body.color !== undefined) patch.color = str(body.color) || "#64748b";
  if (body.modelHours !== undefined) patch.modelHours = _toNum(body.modelHours);
  if (body.sortOrder !== undefined) patch.sortOrder = _toNum(body.sortOrder);
  await updateRow("positions", id, patch);
  return { success: true };
}

async function deletePosition(body: Row) {
  return await deleteById("positions", str(body.id));
}

async function listShiftBudgets(body: Row) {
  const store = str(body.store);
  const year = parseInt(str(body.year), 10);
  const month = parseInt(str(body.month), 10);
  if (!year || !month) return { success: false, message: "Missing year/month" };
  const prefix = ymStr(year, month);
  const rows = await fetchAll("shift_budgets", (q) => {
    q = q.gte("date", prefix + "-01").lte("date", prefix + "-31");
    if (store) q = q.eq("store", store);
    return q;
  });
  // 全店舗表示のときは日別に合算する
  const byDate: Record<string, number> = {};
  rows.forEach((r) => {
    const d = str(r.date);
    byDate[d] = (byDate[d] || 0) + _toNum(r.salesBudget);
  });
  return { success: true, budgets: byDate };
}

async function upsertShiftBudget(body: Row) {
  const store = str(body.store).trim();
  const date = str(body.date);
  const salesBudget = _toNum(body.salesBudget);
  if (!store || !date) return { success: false, message: "Missing fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  const { data: existing, error } = await supabase
    .from("shift_budgets").select("id").eq("store", store).eq("date", date).maybeSingle();
  if (error) throw new Error("shift_budgets: " + error.message);
  if (existing) {
    await updateRow("shift_budgets", str(existing.id), { salesBudget });
  } else {
    await insertRow("shift_budgets", {
      id: uuid(), store, date, salesBudget, createdAt: nowIso(),
    });
  }
  return { success: true };
}

async function deleteShift(body: Row) {
  const shiftId = str(body.shiftId);
  if (!shiftId) return { success: false, message: "Missing fields" };
  const result = await deleteById("shifts", shiftId);
  if (!result.success) return { success: false, message: "Shift not found" };
  return { success: true };
}

// ----------------------------------------------------------------
// Shift patterns (P1/P2/P3 の3固定スロット)
// ----------------------------------------------------------------
const DEFAULT_PATTERNS: [string, string, string, string, string][] = [
  ["P1", "Ca sáng / 早番", "08:00", "17:00", "#2563eb"],
  ["P2", "Ca chiều / 遅番", "13:00", "22:00", "#d97706"],
  ["P3", "Ca đêm / 夜勤", "22:00", "06:00", "#7c3aed"],
];

async function getPatterns(_body: Row) {
  const rows = await fetchAll("shift_patterns");
  const byId: Record<string, Row> = {};
  rows.forEach((r) => { byId[str(r.id)] = r; });

  const patterns = DEFAULT_PATTERNS.map((def) => {
    const existing = byId[def[0]];
    return {
      id: def[0],
      name: existing ? existing.name : def[1],
      startTime: str(existing ? existing.startTime : def[2]),
      endTime: str(existing ? existing.endTime : def[3]),
      color: existing ? existing.color : def[4],
    };
  });
  return { success: true, patterns };
}

async function savePatterns(body: Row) {
  const input = body.patterns as Row[] | undefined;
  if (!input || !input.length) return { success: false, message: "Missing patterns" };

  const byId: Record<string, Row> = {};
  input.forEach((p) => { if (p && p.id) byId[str(p.id)] = p; });

  for (const def of DEFAULT_PATTERNS) {
    const pid = def[0];
    const p = byId[pid];
    if (!p) continue;
    const name = str(p.name).trim() || def[1];
    const startTime = str(p.startTime).trim() || def[2];
    const endTime = str(p.endTime).trim() || def[3];
    const color = str(p.color).trim() || def[4];
    const { error } = await supabase.from("shift_patterns").upsert({
      id: pid, name, startTime, endTime, color,
    });
    if (error) throw new Error("shift_patterns: " + error.message);
  }
  return { success: true };
}

// ----------------------------------------------------------------
// Purchases (仕入れ)
// ----------------------------------------------------------------
const PAYMENT_STATUSES = ["paid", "unpaid"];

function _normPaymentStatus(v: unknown): string {
  const s = str(v).trim();
  return PAYMENT_STATUSES.indexOf(s) >= 0 ? s : "";
}

async function listPurchases(body: Row) {
  const store = str(body.store);
  const dateFrom = str(body.dateFrom);
  const dateTo = str(body.dateTo);

  const rows = await fetchAll("purchases", (q) => {
    if (store) q = q.eq("store", store);
    if (dateFrom) q = q.gte("date", dateFrom);
    if (dateTo) q = q.lte("date", dateTo);
    return q;
  });

  rows.sort((a, b) => {
    const da = str(a.date), db = str(b.date);
    return da < db ? 1 : da > db ? -1 : 0; // newest first
  });

  return {
    success: true,
    purchases: rows.map((r) => ({
      id: r.id,
      store: r.store,
      date: str(r.date),
      vendor: r.vendor,
      productName: r.productName,
      specification: r.specification,
      category: r.category,
      unitPrice: _toNum(r.unitPrice),
      quantity: _toNum(r.quantity),
      taxRate: _toNum(r.taxRate),
      paymentMethod: r.paymentMethod || "",
      paymentStatus: _normPaymentStatus(r.paymentStatus),
      method: r.method || "manual",
      note: r.note,
    })),
  };
}

// マスタに未登録の店舗/業者名を自動追加 (取引フォームの入力を将来の候補に取り込む)
async function _ensureInMaster(table: "stores" | "vendors", name: string) {
  if (!name) return;
  const rows = await fetchAll(table);
  const lower = String(name).trim().toLowerCase();
  if (rows.some((r) => str(r.name).trim().toLowerCase() === lower)) return;
  if (table === "stores") {
    await insertRow("stores", { id: uuid(), name, address: "", phone: "", note: "", createdAt: nowIso() });
  } else {
    await insertRow("vendors", { id: uuid(), name, taxCode: "", address: "", phone: "", note: "", createdAt: nowIso() });
  }
}

// 在庫マスタへの自動反映 (food/drink のみ)
async function _upsertInventoryItem(
  store: string, category: string, productName: string,
  unit: string, unitPrice: number, vendor: string,
) {
  if (!store || !productName) return;
  if (category !== "food" && category !== "drink") return;

  const rows = await fetchAll("inventory_items", (q) => q.eq("store", store));
  const lower = String(productName).trim().toLowerCase();
  const existing = rows.find((r) => str(r.productName).trim().toLowerCase() === lower) || null;

  const nowStr = nowIso();
  if (existing) {
    const patch: Row = { updatedAt: nowStr, lastPurchaseDate: nowStr };
    if (unitPrice > 0) patch.lastUnitPrice = unitPrice;
    if (vendor) patch.lastVendor = vendor;
    if (category) patch.category = category;
    await updateRow("inventory_items", str(existing.id), patch);
  } else {
    await insertRow("inventory_items", {
      id: uuid(),
      store,
      category,
      productName,
      unit: unit || "",
      lastUnitPrice: unitPrice,
      lastVendor: vendor || "",
      archived: false,
      createdAt: nowStr,
      updatedAt: nowStr,
      lastPurchaseDate: nowStr,
    });
  }
}

async function registerPurchase(body: Row) {
  const date = str(body.date);
  const store = str(body.store).trim();
  const vendor = str(body.vendor).trim();
  const productName = str(body.productName).trim();
  if (!date || !store || !productName) return { success: false, message: "Missing required fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };

  await insertRow("purchases", {
    id: uuid(),
    store,
    date,
    vendor,
    productName,
    specification: str(body.specification),
    category: str(body.category),
    unitPrice: _toNum(body.unitPrice),
    quantity: _toNum(body.quantity),
    taxRate: _toNum(body.taxRate),
    paymentMethod: str(body.paymentMethod),
    paymentStatus: _normPaymentStatus(body.paymentStatus),
    method: str(body.method) || "manual",
    note: str(body.note),
    createdAt: nowIso(),
  });
  await _ensureInMaster("stores", store);
  if (vendor) await _ensureInMaster("vendors", vendor);
  await _upsertInventoryItem(
    store,
    str(body.category),
    productName,
    "",
    _toNum(body.unitPrice) * (1 + _toNum(body.taxRate) / 100),
    vendor,
  );
  return { success: true };
}

async function registerPurchaseBatch(body: Row) {
  const date = str(body.date);
  const store = str(body.store).trim();
  const vendor = str(body.vendor).trim();
  const paymentMethod = str(body.paymentMethod);
  const paymentStatus = _normPaymentStatus(body.paymentStatus);
  const items = body.items as Row[] | undefined;
  if (!date || !store) return { success: false, message: "Missing required fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  if (!Array.isArray(items) || items.length === 0) return { success: false, message: "No items" };

  let inserted = 0;
  const toInsert: Row[] = [];
  const invUpdates: [string, string, number, string][] = []; // category, productName, price, vendor
  for (const item of items) {
    const productName = str(item.productName).trim();
    if (!productName) continue;
    const unitPrice = _toNum(item.unitPrice);
    const quantity = _toNum(item.quantity);
    const taxRate = _toNum(item.taxRate);
    const category = str(item.category);
    toInsert.push({
      id: uuid(),
      store,
      date,
      vendor,
      productName,
      specification: str(item.specification),
      category,
      unitPrice,
      quantity,
      taxRate,
      paymentMethod,
      paymentStatus,
      method: "manual",
      note: str(item.note),
      createdAt: nowIso(),
    });
    invUpdates.push([category, productName, unitPrice * (1 + taxRate / 100), vendor]);
    inserted += 1;
  }
  if (toInsert.length) {
    const { error } = await supabase.from("purchases").insert(toInsert);
    if (error) throw new Error("purchases insert: " + error.message);
  }
  for (const [category, productName, price, v] of invUpdates) {
    await _upsertInventoryItem(store, category, productName, "", price, v);
  }
  await _ensureInMaster("stores", store);
  if (vendor) await _ensureInMaster("vendors", vendor);
  return { success: true, inserted };
}

async function deletePurchase(body: Row) {
  return await deleteById("purchases", str(body.id));
}

// ----------------------------------------------------------------
// PettyCash (小口現金)
// ----------------------------------------------------------------
async function listPettyCash(body: Row) {
  const store = str(body.store);
  const year = parseInt(str(body.year), 10);
  const month = parseInt(str(body.month), 10);
  const dateFrom = str(body.dateFrom);
  const dateTo = str(body.dateTo);
  const useRange = !!(dateFrom || dateTo);
  const prefix = !useRange && year && month ? ymStr(year, month) : "";

  const rows = await fetchAll("petty_cash", (q) => {
    if (store) q = q.eq("store", store);
    if (useRange) {
      if (dateFrom) q = q.gte("date", dateFrom);
      if (dateTo) q = q.lte("date", dateTo);
    } else if (prefix) {
      q = q.gte("date", prefix + "-01").lte("date", prefix + "-31");
    }
    return q;
  });

  rows.sort((a, b) => {
    const da = str(a.date), db = str(b.date);
    return da < db ? -1 : da > db ? 1 : 0;
  });

  let balance = 0;
  const items = rows.map((r) => {
    const amount = _toNum(r.amount);
    const type = str(r.type) || "out";
    if (type === "in") balance += amount;
    else balance -= amount;
    return {
      id: r.id,
      store: r.store,
      date: str(r.date),
      type,
      category: r.category,
      subCategory: r.subCategory,
      productName: r.productName || "",
      amount,
      unitPrice: _toNum(r.unitPrice) || amount,
      quantity: _toNum(r.quantity) || 1,
      taxRate: _toNum(r.taxRate),
      paymentMethod: r.paymentMethod || "",
      vendor: r.vendor,
      taxCode: r.taxCode,
      note: r.note,
      balance,
    };
  });

  return { success: true, items, balance };
}

function _resolvePettyAmount(src: Row) {
  const unitPrice = _toNum(src.unitPrice);
  const quantity = _toNum(src.quantity);
  if (unitPrice > 0 && quantity > 0) {
    return { unitPrice, quantity, amount: unitPrice * quantity };
  }
  const amount = _toNum(src.amount);
  return { unitPrice: amount, quantity: 1, amount };
}

async function registerPettyCash(body: Row) {
  const date = str(body.date);
  const store = str(body.store).trim();
  let type = str(body.type) || "out";
  const category = str(body.category).trim();
  const resolved = _resolvePettyAmount(body);

  if (!date || !store || !category) return { success: false, message: "Missing required fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  if (type !== "in" && type !== "out") type = "out";

  const vendorName = str(body.vendor);
  await insertRow("petty_cash", {
    id: uuid(),
    store,
    date,
    type,
    category,
    subCategory: str(body.subCategory),
    productName: str(body.productName),
    amount: resolved.amount,
    unitPrice: resolved.unitPrice,
    quantity: resolved.quantity,
    taxRate: _toNum(body.taxRate),
    paymentMethod: str(body.paymentMethod),
    vendor: vendorName,
    taxCode: str(body.taxCode),
    note: str(body.note),
    createdAt: nowIso(),
  });
  await _ensureInMaster("stores", store);
  if (vendorName.trim()) await _ensureInMaster("vendors", vendorName.trim());
  return { success: true };
}

async function registerPettyCashBatch(body: Row) {
  const date = str(body.date);
  const store = str(body.store).trim();
  let type = str(body.type) || "out";
  const vendor = str(body.vendor).trim();
  const taxCode = str(body.taxCode);
  const items = body.items as Row[] | undefined;
  if (!date || !store) return { success: false, message: "Missing required fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  if (!Array.isArray(items) || items.length === 0) return { success: false, message: "No items" };
  if (type !== "in" && type !== "out") type = "out";

  const toInsert: Row[] = [];
  for (const item of items) {
    const category = str(item.category).trim();
    const resolved = _resolvePettyAmount(item);
    if (!category || resolved.amount <= 0) continue;
    toInsert.push({
      id: uuid(),
      store,
      date,
      type,
      category,
      subCategory: str(item.subCategory),
      productName: str(item.productName),
      amount: resolved.amount,
      unitPrice: resolved.unitPrice,
      quantity: resolved.quantity,
      taxRate: _toNum(item.taxRate),
      paymentMethod: "",
      vendor,
      taxCode,
      note: str(item.note),
      createdAt: nowIso(),
    });
  }
  if (toInsert.length) {
    const { error } = await supabase.from("petty_cash").insert(toInsert);
    if (error) throw new Error("petty_cash insert: " + error.message);
  }
  await _ensureInMaster("stores", store);
  if (vendor) await _ensureInMaster("vendors", vendor);
  return { success: true, inserted: toInsert.length };
}

async function deletePettyCash(body: Row) {
  return await deleteById("petty_cash", str(body.id));
}

// ----------------------------------------------------------------
// Masters: stores / vendors / product names
// ----------------------------------------------------------------
async function listStores(_body: Row) {
  const rows = await fetchAll("stores");
  const names = rows.map((r) => str(r.name).trim()).filter((n) => n);
  names.sort();
  return { success: true, stores: names };
}

async function listVendors(_body: Row) {
  const rows = await fetchAll("vendors");
  const names = rows.map((r) => str(r.name).trim()).filter((n) => n);
  names.sort();
  return { success: true, vendors: names };
}

async function listProductNames(_body: Row) {
  const seen: Record<string, { name: string; date: string }> = {};
  const items: { name: string; date: string }[] = [];

  function collect(rows: Row[]) {
    rows.forEach((r) => {
      const name = str(r.productName).trim();
      if (!name) return;
      const date = str(r.date);
      const key = name.toLowerCase();
      if (seen[key]) {
        if (date > seen[key].date) seen[key].date = date;
        return;
      }
      seen[key] = { name, date };
      items.push(seen[key]);
    });
  }
  collect(await fetchAll("purchases"));
  collect(await fetchAll("petty_cash"));

  items.sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.name.localeCompare(b.name);
  });

  return { success: true, products: items.map((p) => p.name) };
}

async function listStoreMaster(_body: Row) {
  const rows = await fetchAll("stores");
  rows.sort((a, b) => str(a.name).localeCompare(str(b.name)));
  return {
    success: true,
    stores: rows.map((r) => ({
      id: r.id, name: r.name, address: r.address, phone: r.phone, note: r.note,
    })),
  };
}

async function registerStore(body: Row) {
  const name = str(body.name).trim();
  if (!name) return { success: false, message: "Name required" };
  const rows = await fetchAll("stores");
  const lower = name.toLowerCase();
  if (rows.some((r) => str(r.name).trim().toLowerCase() === lower)) {
    return { success: false, code: "DUPLICATE", message: "Store already exists" };
  }
  await insertRow("stores", {
    id: uuid(),
    name,
    address: str(body.address),
    phone: str(body.phone),
    note: str(body.note),
    createdAt: nowIso(),
  });
  return { success: true };
}

async function deleteStore(body: Row) {
  return await deleteById("stores", str(body.id));
}

async function listVendorMaster(_body: Row) {
  const rows = await fetchAll("vendors");
  rows.sort((a, b) => str(a.name).localeCompare(str(b.name)));
  return {
    success: true,
    vendors: rows.map((r) => ({
      id: r.id, name: r.name, taxCode: r.taxCode, address: r.address, phone: r.phone, note: r.note,
    })),
  };
}

async function registerVendor(body: Row) {
  const name = str(body.name).trim();
  if (!name) return { success: false, message: "Name required" };
  const rows = await fetchAll("vendors");
  const lower = name.toLowerCase();
  if (rows.some((r) => str(r.name).trim().toLowerCase() === lower)) {
    return { success: false, code: "DUPLICATE", message: "Vendor already exists" };
  }
  await insertRow("vendors", {
    id: uuid(),
    name,
    taxCode: str(body.taxCode),
    address: str(body.address),
    phone: str(body.phone),
    note: str(body.note),
    createdAt: nowIso(),
  });
  return { success: true };
}

async function deleteVendor(body: Row) {
  return await deleteById("vendors", str(body.id));
}

// ----------------------------------------------------------------
// Daily sales + Monthly targets
// ----------------------------------------------------------------
async function listDailySales(body: Row) {
  const store = str(body.store);
  const year = parseInt(str(body.year), 10);
  const month = parseInt(str(body.month), 10);
  const dateFrom = str(body.dateFrom);
  const dateTo = str(body.dateTo);
  if (!store) return { success: false, message: "Missing fields" };
  const prefix = year && month ? ymStr(year, month) : "";

  const rows = await fetchAll("daily_sales", (q) => {
    q = q.eq("store", store);
    if (dateFrom) q = q.gte("date", dateFrom);
    if (dateTo) q = q.lte("date", dateTo);
    if (!dateFrom && !dateTo && prefix) {
      q = q.gte("date", prefix + "-01").lte("date", prefix + "-31");
    }
    return q;
  });
  rows.sort((a, b) => {
    const da = str(a.date), db = str(b.date);
    return da < db ? 1 : da > db ? -1 : 0;
  });
  return {
    success: true,
    items: rows.map((r) => ({
      id: r.id,
      store: r.store,
      date: str(r.date),
      foodSales: _toNum(r.foodSales),
      drinkSales: _toNum(r.drinkSales),
      otherSales: _toNum(r.otherSales),
      customers: _toNum(r.customers),
      note: r.note,
      totalSalesIncl: _toNum(r.totalSalesIncl),
      totalSalesExcl: _toNum(r.totalSalesExcl),
      foodSalesIncl: _toNum(r.foodSalesIncl),
      foodSalesExcl: _toNum(r.foodSalesExcl),
      drinkSalesIncl: _toNum(r.drinkSalesIncl),
      drinkSalesExcl: _toNum(r.drinkSalesExcl),
      paymentCash: _toNum(r.paymentCash),
      paymentQr: _toNum(r.paymentQr),
      paymentCard: _toNum(r.paymentCard),
      discountAmount: _toNum(r.discountAmount),
      depositAmount: _toNum(r.depositAmount),
      pettyCashAmount: _toNum(r.pettyCashAmount),
    })),
  };
}

async function upsertDailySales(body: Row) {
  const store = str(body.store).trim();
  const date = str(body.date);
  if (!store || !date) return { success: false, message: "Missing fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };

  const { data: existing, error } = await supabase
    .from("daily_sales").select("*").eq("store", store).eq("date", date).maybeSingle();
  if (error) throw new Error("daily_sales: " + error.message);

  const totalSalesIncl = _toNum(body.totalSalesIncl);
  const totalSalesExcl = _toNum(body.totalSalesExcl);
  const foodSalesIncl = _toNum(body.foodSalesIncl);
  const foodSalesExcl = _toNum(body.foodSalesExcl);
  const drinkSalesIncl = _toNum(body.drinkSalesIncl);
  const drinkSalesExcl = _toNum(body.drinkSalesExcl);
  const foodSales = foodSalesExcl || _toNum(body.foodSales);
  const drinkSales = drinkSalesExcl || _toNum(body.drinkSales);
  const otherFromTotal = totalSalesExcl - foodSales - drinkSales;
  const otherSales = otherFromTotal > 0 ? otherFromTotal : _toNum(body.otherSales);

  const data: Row = {
    id: existing ? existing.id : uuid(),
    store,
    date,
    foodSales,
    drinkSales,
    otherSales,
    customers: _toNum(body.customers),
    note: str(body.note),
    createdAt: existing ? existing.createdAt : nowIso(),
    totalSalesIncl,
    totalSalesExcl,
    foodSalesIncl,
    foodSalesExcl,
    drinkSalesIncl,
    drinkSalesExcl,
    paymentCash: _toNum(body.paymentCash),
    paymentQr: _toNum(body.paymentQr),
    paymentCard: _toNum(body.paymentCard),
    discountAmount: _toNum(body.discountAmount),
    depositAmount: _toNum(body.depositAmount),
    pettyCashAmount: _toNum(body.pettyCashAmount),
  };
  const { error: upErr } = await supabase.from("daily_sales").upsert(data);
  if (upErr) throw new Error("daily_sales upsert: " + upErr.message);
  return { success: true };
}

async function deleteDailySales(body: Row) {
  return await deleteById("daily_sales", str(body.id));
}

async function getMonthlyTarget(body: Row) {
  const store = str(body.store);
  const yearMonth = str(body.yearMonth);
  if (!store || !yearMonth) return { success: false, message: "Missing fields" };

  const { data: found, error } = await supabase
    .from("monthly_targets").select("*").eq("store", store).eq("yearMonth", yearMonth).maybeSingle();
  if (error) throw new Error("monthly_targets: " + error.message);
  if (!found) return { success: true, target: null };
  return {
    success: true,
    target: {
      id: found.id,
      store: found.store,
      yearMonth: found.yearMonth,
      foodSalesTarget: _toNum(found.foodSalesTarget),
      drinkSalesTarget: _toNum(found.drinkSalesTarget),
      otherSalesTarget: _toNum(found.otherSalesTarget),
      foodCostRatioTarget: _toNum(found.foodCostRatioTarget),
      drinkCostRatioTarget: _toNum(found.drinkCostRatioTarget),
      laborCostRatioTarget: _toNum(found.laborCostRatioTarget),
      monthlyLaborCost: _toNum(found.monthlyLaborCost),
      note: found.note,
    },
  };
}

async function upsertMonthlyTarget(body: Row) {
  const store = str(body.store).trim();
  const yearMonth = str(body.yearMonth);
  if (!store || !yearMonth) return { success: false, message: "Missing fields" };
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return { success: false, message: "Invalid yearMonth" };

  const { data: existing, error } = await supabase
    .from("monthly_targets").select("*").eq("store", store).eq("yearMonth", yearMonth).maybeSingle();
  if (error) throw new Error("monthly_targets: " + error.message);

  // monthlyLaborCost が送られてこなければ既存値を保持 (専用エンドポイントで編集されるため)
  const hasLaborInBody = Object.prototype.hasOwnProperty.call(body, "monthlyLaborCost") &&
    body.monthlyLaborCost !== "" && body.monthlyLaborCost !== null &&
    body.monthlyLaborCost !== undefined;
  const preservedLaborCost = hasLaborInBody
    ? _toNum(body.monthlyLaborCost)
    : (existing ? _toNum(existing.monthlyLaborCost) : 0);

  const data: Row = {
    id: existing ? existing.id : uuid(),
    store,
    yearMonth,
    foodSalesTarget: _toNum(body.foodSalesTarget),
    drinkSalesTarget: _toNum(body.drinkSalesTarget),
    otherSalesTarget: _toNum(body.otherSalesTarget),
    foodCostRatioTarget: _toNum(body.foodCostRatioTarget),
    drinkCostRatioTarget: _toNum(body.drinkCostRatioTarget),
    laborCostRatioTarget: _toNum(body.laborCostRatioTarget),
    monthlyLaborCost: preservedLaborCost,
    note: str(body.note),
    createdAt: existing ? existing.createdAt : nowIso(),
  };
  const { error: upErr } = await supabase.from("monthly_targets").upsert(data);
  if (upErr) throw new Error("monthly_targets upsert: " + upErr.message);
  return { success: true };
}

async function updateMonthlyLaborCost(body: Row) {
  const store = str(body.store).trim();
  const yearMonth = str(body.yearMonth);
  const amount = _toNum(body.monthlyLaborCost);
  if (!store || !yearMonth) return { success: false, message: "Missing fields" };
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return { success: false, message: "Invalid yearMonth" };

  const { data: existing, error } = await supabase
    .from("monthly_targets").select("id").eq("store", store).eq("yearMonth", yearMonth).maybeSingle();
  if (error) throw new Error("monthly_targets: " + error.message);
  if (existing) {
    await updateRow("monthly_targets", str(existing.id), { monthlyLaborCost: amount });
  } else {
    await insertRow("monthly_targets", {
      id: uuid(), store, yearMonth, monthlyLaborCost: amount, createdAt: nowIso(),
    });
  }
  return { success: true };
}

// ----------------------------------------------------------------
// 勤怠集計エンジン (人件費 / 勤怠サマリ共通)
// GAS 版 buildAttendanceBreakdown の移植。仕様コメントは Code.gs 参照。
// ----------------------------------------------------------------
interface BreakdownRow {
  userId: string;
  name: string;
  role: string;
  homeStore: string;
  store: string;
  isAway: boolean;
  days: number;
  minutes: number;
  cost: number;
  rateType: string;
  rate: number;
  hours: number;
}

async function buildAttendanceBreakdown(
  year: number, month: number, dateFrom?: string, dateTo?: string,
): Promise<BreakdownRow[]> {
  const targetYM = ymStr(year, month);
  const hasRange = /^\d{4}-\d{2}-\d{2}$/.test(String(dateFrom || "")) &&
    /^\d{4}-\d{2}-\d{2}$/.test(String(dateTo || ""));
  function inScope(dateStr: string): boolean {
    return hasRange
      ? (dateStr >= dateFrom! && dateStr <= dateTo!)
      : (dateStr.substring(0, 7) === targetYM);
  }

  // 深夜跨ぎシフトのペアリング用に対象範囲の前後2日分まで読む。
  const scopeFrom = hasRange ? dateFrom! : targetYM + "-01";
  const scopeTo = hasRange ? dateTo! : targetYM + "-31";
  const effFrom = addDays(scopeFrom, -2);
  const effTo = addDays(scopeTo, 2);

  const userMap: Record<string, {
    name: string; role: string; homeStore: string; hourlyRate: number; dailyRate: number;
  }> = {};
  (await fetchAll("users")).forEach((u) => {
    userMap[str(u.id)] = {
      name: str(u.name),
      role: str(u.role),
      homeStore: str(u.store).trim(),
      hourlyRate: _toNum(u.hourlyRate),
      dailyRate: _toNum(u.dailyRate),
    };
  });

  const byUser: Record<string, { type: string; ts: Date; store: string }[]> = {};
  (await fetchAll("attendance", (q) => q.gte("date", effFrom).lte("date", effTo))).forEach((r) => {
    const uid = str(r.userId);
    if (!userMap[uid]) return;
    const ts = new Date(str(r.timestamp));
    if (isNaN(ts.getTime())) return;
    if (!byUser[uid]) byUser[uid] = [];
    byUser[uid].push({ type: str(r.type), ts, store: str(r.store).trim() });
  });

  const acc: Record<string, BreakdownRow> = {};
  function bucket(uid: string, store: string): BreakdownRow {
    const key = uid + " " + store;
    if (!acc[key]) {
      const u = userMap[uid];
      acc[key] = {
        userId: uid,
        name: u.name,
        role: u.role,
        homeStore: u.homeStore,
        store,
        isAway: !!store && !!u.homeStore && store !== u.homeStore,
        days: 0,
        minutes: 0,
        cost: 0,
        rateType: u.dailyRate > 0 ? "daily" : "hourly",
        rate: u.dailyRate > 0 ? u.dailyRate : u.hourlyRate,
        hours: 0,
      };
    }
    return acc[key];
  }

  Object.keys(byUser).forEach((uid) => {
    const u = userMap[uid];
    const events = byUser[uid].sort((a, b) => a.ts.getTime() - b.ts.getTime());
    const isDaily = u.dailyRate > 0;
    const dayStore: Record<string, string> = {};

    let clockIn: Date | null = null;
    let clockInStore = "";
    let breakStart: Date | null = null;
    let breakTotal = 0;
    for (const ev of events) {
      if (ev.type === "clock_in") {
        clockIn = ev.ts;
        clockInStore = ev.store || u.homeStore;
        breakStart = null;
        breakTotal = 0;
        const dstr = fmtDateVN(ev.ts);
        if (inScope(dstr) && dayStore[dstr] === undefined) dayStore[dstr] = clockInStore;
      } else if (ev.type === "break_start" && clockIn) {
        breakStart = ev.ts;
      } else if (ev.type === "break_end" && breakStart) {
        breakTotal += ev.ts.getTime() - breakStart.getTime();
        breakStart = null;
      } else if (ev.type === "clock_out" && clockIn) {
        const inDate = fmtDateVN(clockIn);
        if (inScope(inDate)) {
          let minutes = ((ev.ts.getTime() - clockIn.getTime()) - breakTotal) / 60000;
          if (minutes < 0) minutes = 0;
          const b = bucket(uid, clockInStore);
          b.minutes += minutes;
          if (!isDaily) b.cost += (minutes / 60) * u.hourlyRate;
        }
        clockIn = null; clockInStore = ""; breakStart = null; breakTotal = 0;
      }
    }

    Object.keys(dayStore).forEach((d) => {
      const b = bucket(uid, dayStore[d]);
      b.days += 1;
      if (isDaily) b.cost += u.dailyRate;
    });
  });

  const rows = Object.keys(acc).map((k) => {
    const r = acc[k];
    r.hours = r.minutes / 60;
    r.cost = Math.round(r.cost);
    return r;
  });
  rows.sort((a, b) => {
    if (a.store !== b.store) return a.store < b.store ? -1 : 1;
    return String(a.name).localeCompare(String(b.name));
  });
  return rows;
}

async function calcAttendanceLaborCost(
  store: string, year: number, month: number, dateFrom?: string, dateTo?: string,
) {
  const rows = await buildAttendanceBreakdown(year, month, dateFrom, dateTo);
  let cost = 0, minutes = 0;
  rows.forEach((r) => {
    if (r.store !== store) return;
    cost += r.cost;
    minutes += r.minutes;
  });
  return { cost: Math.round(cost), hours: minutes / 60 };
}

async function getAttendanceSummary(body: Row) {
  const year = parseInt(str(body.year), 10);
  const month = parseInt(str(body.month), 10);
  const dateFrom = str(body.dateFrom);
  const dateTo = str(body.dateTo);
  const storeFilter = str(body.store);
  if (!year || !month) return { success: false, message: "Missing year/month" };

  let rows = await buildAttendanceBreakdown(year, month, dateFrom, dateTo);
  if (storeFilter) rows = rows.filter((r) => r.store === storeFilter);
  rows = rows.filter((r) => r.days > 0 || r.minutes > 0 || r.cost > 0);

  let totalCost = 0, totalMinutes = 0, totalDays = 0;
  const byStore: Record<string, { store: string; cost: number; hours: number; days: number; people: number }> = {};
  rows.forEach((r) => {
    totalCost += r.cost;
    totalMinutes += r.minutes;
    totalDays += r.days;
    if (!byStore[r.store]) byStore[r.store] = { store: r.store, cost: 0, hours: 0, days: 0, people: 0 };
    byStore[r.store].cost += r.cost;
    byStore[r.store].hours += r.hours;
    byStore[r.store].days += r.days;
    byStore[r.store].people += 1;
  });

  return {
    success: true,
    yearMonth: ymStr(year, month),
    rows: rows.map((r) => ({
      userId: r.userId,
      name: r.name,
      role: r.role,
      store: r.store,
      homeStore: r.homeStore,
      isAway: r.isAway,
      days: r.days,
      hours: r.hours,
      cost: r.cost,
      rateType: r.rateType,
      rate: r.rate,
    })),
    byStore: Object.keys(byStore).sort().map((k) => byStore[k]),
    totals: { cost: totalCost, hours: totalMinutes / 60, days: totalDays },
  };
}

async function listUnclosedPunches(body: Row) {
  let minHours = _toNum(body && body.minHours);
  if (!minHours || minHours <= 0) minHours = 12;
  const now = new Date();

  const userMap: Record<string, { name: string; store: string }> = {};
  (await fetchAll("users")).forEach((u) => {
    userMap[str(u.id)] = { name: str(u.name), store: str(u.store).trim() };
  });

  // 直近分だけ見れば十分
  const { data, error } = await supabase
    .from("attendance").select("*")
    .order("timestamp", { ascending: false })
    .limit(3000);
  if (error) throw new Error("attendance: " + error.message);

  const byUser: Record<string, { type: string; ts: Date; store: string }[]> = {};
  (data as Row[]).forEach((r) => {
    const uid = str(r.userId);
    if (!userMap[uid]) return;
    const ts = new Date(str(r.timestamp));
    if (isNaN(ts.getTime())) return;
    if (!byUser[uid]) byUser[uid] = [];
    byUser[uid].push({ type: str(r.type), ts, store: str(r.store).trim() });
  });

  const open: Row[] = [];
  Object.keys(byUser).forEach((uid) => {
    const events = byUser[uid].sort((a, b) => a.ts.getTime() - b.ts.getTime());
    let startIdx = 0;
    for (let i = events.length - 1; i >= 0; i--) {
      if (events[i].type === "clock_out") { startIdx = i + 1; break; }
    }
    const ongoing = events.slice(startIdx);
    if (!ongoing.length) return;
    let clockIn = null as { type: string; ts: Date; store: string } | null;
    for (const ev of ongoing) {
      if (ev.type === "clock_in") { clockIn = ev; break; }
    }
    if (!clockIn) return;
    const elapsedHours = (now.getTime() - clockIn.ts.getTime()) / 3600000;
    if (elapsedHours < minHours) return;
    const last = ongoing[ongoing.length - 1];
    open.push({
      userId: uid,
      name: userMap[uid].name,
      store: clockIn.store || userMap[uid].store,
      clockInAt: fmtIsoVN(clockIn.ts),
      clockInDate: fmtDateVN(clockIn.ts),
      elapsedHours: Math.round(elapsedHours * 10) / 10,
      lastType: last.type,
    });
  });

  open.sort((a, b) => _toNum(b.elapsedHours) - _toNum(a.elapsedHours));
  return { success: true, minHours, items: open };
}

// ----------------------------------------------------------------
// Dashboard
// ----------------------------------------------------------------
async function getDashboard(body: Row) {
  const store = str(body.store);
  let dateFrom = str(body.dateFrom);
  let dateTo = str(body.dateTo);
  if (!store) return { success: false, message: "Missing fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    return { success: false, message: "Missing or invalid dateFrom/dateTo" };
  }
  if (dateFrom > dateTo) { const tmp = dateFrom; dateFrom = dateTo; dateTo = tmp; }
  const year = parseInt(dateFrom.slice(0, 4), 10);
  const month = parseInt(dateFrom.slice(5, 7), 10);
  const yearMonth = ymStr(year, month);
  const prevYM = prevYmStr(year, month);

  // Sales
  const monthlyDaily = await fetchAll("daily_sales", (q) =>
    q.eq("store", store).gte("date", dateFrom).lte("date", dateTo));
  let foodSales = 0, drinkSales = 0, otherSales = 0, customers = 0;
  let foodSalesIncl = 0, foodSalesExcl = 0;
  let drinkSalesIncl = 0, drinkSalesExcl = 0;
  let totalSalesIncl = 0, totalSalesExcl = 0;
  let paymentCash = 0, paymentQr = 0, paymentCard = 0;
  let discountAmount = 0, depositAmount = 0, pettyCashAmount = 0;
  monthlyDaily.forEach((r) => {
    foodSales += _toNum(r.foodSales);
    drinkSales += _toNum(r.drinkSales);
    otherSales += _toNum(r.otherSales);
    customers += _toNum(r.customers);
    foodSalesIncl += _toNum(r.foodSalesIncl);
    foodSalesExcl += _toNum(r.foodSalesExcl);
    drinkSalesIncl += _toNum(r.drinkSalesIncl);
    drinkSalesExcl += _toNum(r.drinkSalesExcl);
    totalSalesIncl += _toNum(r.totalSalesIncl);
    totalSalesExcl += _toNum(r.totalSalesExcl);
    paymentCash += _toNum(r.paymentCash);
    paymentQr += _toNum(r.paymentQr);
    paymentCard += _toNum(r.paymentCard);
    discountAmount += _toNum(r.discountAmount);
    depositAmount += _toNum(r.depositAmount);
    pettyCashAmount += _toNum(r.pettyCashAmount);
  });
  const totalSales = foodSales + drinkSales + otherSales;
  const paymentTotal = paymentCash + paymentQr + paymentCard;

  // Purchases (cost)
  const monthlyPurchases = await fetchAll("purchases", (q) =>
    q.eq("store", store).gte("date", dateFrom).lte("date", dateTo));
  let foodPurchases = 0, drinkPurchases = 0, otherCost = 0;
  monthlyPurchases.forEach((r) => {
    const amt = _toNum(r.unitPrice) * _toNum(r.quantity) * (1 + _toNum(r.taxRate) / 100);
    const cat = str(r.category);
    if (cat === "food") foodPurchases += amt;
    else if (cat === "drink") drinkPurchases += amt;
    else otherCost += amt;
  });

  // 小口現金で仕入れた分 (purchaseFood / purchaseDrink) も仕入れ高に含める
  let pettyFoodPurchases = 0, pettyDrinkPurchases = 0;
  (await fetchAll("petty_cash", (q) =>
    q.eq("store", store).gte("date", dateFrom).lte("date", dateTo))).forEach((r) => {
    const cat = str(r.category);
    if (cat !== "purchaseFood" && cat !== "purchaseDrink") return;
    let amt = _toNum(r.amount);
    if ((str(r.type) || "out") === "in") amt = -amt;
    if (cat === "purchaseFood") pettyFoodPurchases += amt;
    else pettyDrinkPurchases += amt;
  });
  foodPurchases += pettyFoodPurchases;
  drinkPurchases += pettyDrinkPurchases;

  // 棚卸ベースの使用高: 当月使用高 = 前月棚卸高 + 当月仕入れ - 当月棚卸高
  const stRows = await fetchAll("stocktakes", (q) =>
    q.eq("store", store).in("yearMonth", [yearMonth, prevYM]));
  const prevStock = { food: 0, drink: 0 };
  const currStock = { food: 0, drink: 0 };
  const hasPrevStock = { food: false, drink: false };
  const hasCurrStock = { food: false, drink: false };
  stRows.forEach((r) => {
    const cat = str(r.category);
    if (cat !== "food" && cat !== "drink") return;
    const ym = str(r.yearMonth);
    const amt = _toNum(r.amount);
    if (ym === yearMonth) {
      currStock[cat as "food" | "drink"] += amt;
      hasCurrStock[cat as "food" | "drink"] = true;
    } else if (ym === prevYM) {
      prevStock[cat as "food" | "drink"] += amt;
      hasPrevStock[cat as "food" | "drink"] = true;
    }
  });

  const foodCost = (hasPrevStock.food || hasCurrStock.food)
    ? (prevStock.food + foodPurchases - currStock.food)
    : foodPurchases;
  const drinkCost = (hasPrevStock.drink || hasCurrStock.drink)
    ? (prevStock.drink + drinkPurchases - currStock.drink)
    : drinkPurchases;
  const totalCost = foodCost + drinkCost + otherCost;

  // Monthly targets
  const { data: target, error: tErr } = await supabase
    .from("monthly_targets").select("*").eq("store", store).eq("yearMonth", yearMonth).maybeSingle();
  if (tErr) throw new Error("monthly_targets: " + tErr.message);
  const foodSalesTarget = target ? _toNum(target.foodSalesTarget) : 0;
  const drinkSalesTarget = target ? _toNum(target.drinkSalesTarget) : 0;
  const otherSalesTarget = target ? _toNum(target.otherSalesTarget) : 0;
  const salesTarget = foodSalesTarget + drinkSalesTarget + otherSalesTarget;
  const foodCostRatioTarget = target ? _toNum(target.foodCostRatioTarget) : 0;
  const drinkCostRatioTarget = target ? _toNum(target.drinkCostRatioTarget) : 0;
  const laborCostRatioTarget = target ? _toNum(target.laborCostRatioTarget) : 0;
  const otherLaborCost = target ? _toNum(target.monthlyLaborCost) : 0;

  // Pace calc
  const nowStr = todayStr();
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  let elapsedRangeDays = 0;
  let totalRangeDays = 0;
  {
    let cur = dateFrom;
    while (cur <= dateTo) {
      totalRangeDays += 1;
      if (cur <= nowStr) elapsedRangeDays += 1;
      cur = addDays(cur, 1);
    }
  }

  const attLabor = await calcAttendanceLaborCost(store, year, month, dateFrom, dateTo);
  const daysInMonthForLabor = daysInMonth;
  const laborPart = (totalRangeDays > 0 && daysInMonthForLabor > 0)
    ? Math.min(totalRangeDays, daysInMonthForLabor) / daysInMonthForLabor
    : 0;
  const otherLaborCostPart = otherLaborCost * laborPart;
  const totalLaborCost = otherLaborCostPart + attLabor.cost;
  const todayDay = elapsedRangeDays;
  const expectedToToday = salesTarget * (daysInMonth > 0 ? elapsedRangeDays / daysInMonth : 0);

  const profit = totalSales - totalCost - totalLaborCost;

  return {
    success: true,
    yearMonth,
    daysInMonth,
    todayDay,
    dateFrom,
    dateTo,
    totalRangeDays,
    elapsedRangeDays,
    sales: {
      total: totalSales,
      food: foodSales,
      drink: drinkSales,
      other: otherSales,
      customers,
      avgPerCustomer: customers > 0 ? totalSales / customers : 0,
      foodIncl: foodSalesIncl,
      foodExcl: foodSalesExcl,
      drinkIncl: drinkSalesIncl,
      drinkExcl: drinkSalesExcl,
      totalIncl: totalSalesIncl,
      totalExcl: totalSalesExcl,
    },
    payments: {
      cash: paymentCash,
      qr: paymentQr,
      card: paymentCard,
      total: paymentTotal,
      cashRatio: paymentTotal > 0 ? paymentCash / paymentTotal : 0,
      qrRatio: paymentTotal > 0 ? paymentQr / paymentTotal : 0,
      cardRatio: paymentTotal > 0 ? paymentCard / paymentTotal : 0,
    },
    other: {
      discount: discountAmount,
      deposit: depositAmount,
      pettyCash: pettyCashAmount,
    },
    cost: {
      total: totalCost,
      food: foodCost,
      drink: drinkCost,
      other: otherCost,
      foodRatio: foodSales > 0 ? foodCost / foodSales : 0,
      drinkRatio: drinkSales > 0 ? drinkCost / drinkSales : 0,
      totalRatio: totalSales > 0 ? totalCost / totalSales : 0,
    },
    target: {
      sales: salesTarget,
      foodSales: foodSalesTarget,
      drinkSales: drinkSalesTarget,
      otherSales: otherSalesTarget,
      foodCostRatio: foodCostRatioTarget,
      drinkCostRatio: drinkCostRatioTarget,
      laborCostRatio: laborCostRatioTarget,
    },
    labor: {
      cost: totalLaborCost,
      ratio: totalSales > 0 ? totalLaborCost / totalSales : 0,
      attendance: {
        cost: attLabor.cost,
        hours: attLabor.hours,
        ratio: totalSales > 0 ? attLabor.cost / totalSales : 0,
      },
      other: {
        cost: otherLaborCostPart,
        ratio: totalSales > 0 ? otherLaborCostPart / totalSales : 0,
        monthlyTotal: otherLaborCost,
      },
      salesPerHour: attLabor.hours > 0 ? totalSales / attLabor.hours : 0,
    },
    profit: {
      amount: profit,
      ratio: totalSales > 0 ? profit / totalSales : 0,
    },
    achievement: {
      monthlyProgress: salesTarget > 0 ? totalSales / salesTarget : 0,
      todayPace: expectedToToday > 0 ? totalSales / expectedToToday : 0,
    },
  };
}

// ----------------------------------------------------------------
// Locations master
// ----------------------------------------------------------------
async function listLocations(body: Row) {
  const store = str(body.store);
  if (!store) return { success: false, message: "Missing store" };
  const rows = await fetchAll("locations", (q) => q.eq("store", store));
  rows.sort((a, b) => {
    const oa = _toNum(a.sortOrder), ob = _toNum(b.sortOrder);
    if (oa !== ob) return oa - ob;
    return str(a.name).localeCompare(str(b.name));
  });
  return {
    success: true,
    locations: rows.map((r) => ({
      id: r.id, store: r.store, name: r.name, sortOrder: _toNum(r.sortOrder),
    })),
  };
}

async function registerLocation(body: Row) {
  const store = str(body.store).trim();
  const name = str(body.name).trim();
  if (!store || !name) return { success: false, message: "Missing fields" };

  const rows = await fetchAll("locations", (q) => q.eq("store", store));
  const lower = name.toLowerCase();
  if (rows.some((r) => str(r.name).trim().toLowerCase() === lower)) {
    return { success: false, code: "DUPLICATE", message: "Location already exists" };
  }
  const nextOrder = (rows.length + 1) * 10;
  await insertRow("locations", {
    id: uuid(), store, name, sortOrder: nextOrder, createdAt: nowIso(),
  });
  return { success: true };
}

async function deleteLocation(body: Row) {
  return await deleteById("locations", str(body.id));
}

// ----------------------------------------------------------------
// Inventory items master
// ----------------------------------------------------------------
async function listInventoryItems(body: Row) {
  const store = str(body.store);
  if (!store) return { success: false, message: "Missing store" };
  const rows = await fetchAll("inventory_items", (q) => q.eq("store", store).eq("archived", false));
  rows.sort((a, b) => {
    const ua = str(a.updatedAt), ub = str(b.updatedAt);
    return ua < ub ? 1 : ua > ub ? -1 : 0;
  });
  return {
    success: true,
    items: rows.map((r) => ({
      id: r.id,
      category: r.category,
      productName: r.productName,
      unit: r.unit,
      lastUnitPrice: _toNum(r.lastUnitPrice),
      lastVendor: r.lastVendor,
      lastPurchaseDate: r.lastPurchaseDate || "",
      updatedAt: r.updatedAt,
    })),
  };
}

async function registerInventoryItem(body: Row) {
  const store = str(body.store).trim();
  const productName = str(body.productName).trim();
  if (!store || !productName) return { success: false, message: "Missing fields" };

  const rows = await fetchAll("inventory_items", (q) => q.eq("store", store));
  const lower = productName.toLowerCase();
  if (rows.some((r) => str(r.productName).trim().toLowerCase() === lower)) {
    return { success: false, code: "DUPLICATE", message: "Item already exists" };
  }
  const id = uuid();
  await insertRow("inventory_items", {
    id,
    store,
    category: str(body.category) || "other",
    productName,
    unit: str(body.unit),
    lastUnitPrice: _toNum(body.lastUnitPrice),
    lastVendor: str(body.lastVendor),
    archived: false,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  });
  return { success: true, id };
}

async function deleteInventoryItem(body: Row) {
  return await deleteById("inventory_items", str(body.id));
}

// ----------------------------------------------------------------
// Stocktake (棚卸)
// ----------------------------------------------------------------
async function listStocktakeSummary(body: Row) {
  const store = str(body.store);
  const year = parseInt(str(body.year), 10);
  const month = parseInt(str(body.month), 10);
  if (!store || !year || !month) return { success: false, message: "Missing fields" };

  const yearMonth = ymStr(year, month);
  const prevYM = prevYmStr(year, month);

  const locations = (await fetchAll("locations", (q) => q.eq("store", store)))
    .sort((a, b) => _toNum(a.sortOrder) - _toNum(b.sortOrder));

  const stRows = await fetchAll("stocktakes", (q) =>
    q.eq("store", store).in("yearMonth", [yearMonth, prevYM]));
  const current: Record<string, { itemCount: number; totalAmount: number; lastUpdated: string }> = {};
  let prevTotal = 0, currentTotal = 0;
  let currentFoodTotal = 0, currentDrinkTotal = 0;
  let prevFoodTotal = 0, prevDrinkTotal = 0;
  stRows.forEach((r) => {
    const ym = str(r.yearMonth);
    const amt = _toNum(r.amount);
    const cat = str(r.category);
    if (ym === yearMonth) {
      const loc = str(r.location);
      if (!current[loc]) current[loc] = { itemCount: 0, totalAmount: 0, lastUpdated: "" };
      current[loc].itemCount += 1;
      current[loc].totalAmount += amt;
      const u = str(r.updatedAt) || str(r.createdAt);
      if (u > current[loc].lastUpdated) current[loc].lastUpdated = u;
      currentTotal += amt;
      if (cat === "food") currentFoodTotal += amt;
      else if (cat === "drink") currentDrinkTotal += amt;
    } else if (ym === prevYM) {
      prevTotal += amt;
      if (cat === "food") prevFoodTotal += amt;
      else if (cat === "drink") prevDrinkTotal += amt;
    }
  });

  const summary = locations.map((loc) => {
    const s = current[str(loc.name)] || { itemCount: 0, totalAmount: 0, lastUpdated: "" };
    return {
      locationId: loc.id,
      name: loc.name,
      itemCount: s.itemCount,
      totalAmount: s.totalAmount,
      lastUpdated: s.lastUpdated,
    };
  });

  const completedCount = summary.filter((s) => s.itemCount > 0).length;

  return {
    success: true,
    yearMonth,
    prevYearMonth: prevYM,
    locationCount: locations.length,
    completedCount,
    currentTotal,
    currentFoodTotal,
    currentDrinkTotal,
    prevTotal,
    prevFoodTotal,
    prevDrinkTotal,
    summary,
  };
}

async function listStocktakeEntries(body: Row) {
  const store = str(body.store);
  const location = str(body.location);
  const year = parseInt(str(body.year), 10);
  const month = parseInt(str(body.month), 10);
  if (!store || !location || !year || !month) return { success: false, message: "Missing fields" };

  const yearMonth = ymStr(year, month);
  const rows = await fetchAll("stocktakes", (q) =>
    q.eq("store", store).eq("location", location).eq("yearMonth", yearMonth));
  rows.sort((a, b) => {
    const ca = str(a.createdAt), cb = str(b.createdAt);
    return ca < cb ? -1 : ca > cb ? 1 : 0;
  });

  const invRows = await fetchAll("inventory_items", (q) => q.eq("store", store));
  const invMap: Record<string, string> = {};
  invRows.forEach((i) => {
    invMap[str(i.productName).trim().toLowerCase()] = str(i.lastPurchaseDate);
  });

  return {
    success: true,
    entries: rows.map((r) => {
      const key = str(r.productName).trim().toLowerCase();
      return {
        id: r.id,
        itemId: r.itemId,
        category: r.category,
        productName: r.productName,
        unit: r.unit,
        vendor: r.vendor,
        unitPrice: _toNum(r.unitPrice),
        quantity: _toNum(r.quantity),
        amount: _toNum(r.amount),
        note: r.note,
        lastPurchaseDate: invMap[key] || "",
      };
    }),
  };
}

async function upsertStocktakeEntry(body: Row) {
  const store = str(body.store).trim();
  const location = str(body.location).trim();
  const year = parseInt(str(body.year), 10);
  const month = parseInt(str(body.month), 10);
  const productName = str(body.productName).trim();
  if (!store || !location || !year || !month || !productName) {
    return { success: false, message: "Missing fields" };
  }
  const yearMonth = ymStr(year, month);
  const itemId = str(body.itemId);

  // id 指定があればそれを優先し、なければ (store, location, yearMonth, productName) で照合
  let existing: Row | null = null;
  if (body.id) {
    const { data, error } = await supabase
      .from("stocktakes").select("*").eq("id", str(body.id)).maybeSingle();
    if (error) throw new Error("stocktakes: " + error.message);
    existing = data;
  }
  if (!existing) {
    const rows = await fetchAll("stocktakes", (q) =>
      q.eq("store", store).eq("location", location).eq("yearMonth", yearMonth));
    const lower = productName.toLowerCase();
    existing = rows.find((r) => str(r.productName).trim().toLowerCase() === lower) || null;
  }

  const quantity = _toNum(body.quantity);
  const unitPrice = _toNum(body.unitPrice);
  const amount = quantity * unitPrice;

  const data: Row = {
    id: existing ? existing.id : uuid(),
    store,
    location,
    yearMonth,
    itemId,
    category: str(body.category),
    productName,
    unit: str(body.unit),
    vendor: str(body.vendor) || (existing ? str(existing.vendor) : ""),
    unitPrice,
    quantity,
    amount,
    note: str(body.note),
    createdAt: existing ? existing.createdAt : nowIso(),
    updatedAt: nowIso(),
  };
  const { error: upErr } = await supabase.from("stocktakes").upsert(data);
  if (upErr) throw new Error("stocktakes upsert: " + upErr.message);
  return { success: true, id: data.id, amount };
}

async function deleteStocktakeEntry(body: Row) {
  return await deleteById("stocktakes", str(body.id));
}

async function copyStocktakeFromPrevMonth(body: Row) {
  const store = str(body.store);
  const location = str(body.location);
  const year = parseInt(str(body.year), 10);
  const month = parseInt(str(body.month), 10);
  if (!store || !location || !year || !month) return { success: false, message: "Missing fields" };

  const yearMonth = ymStr(year, month);
  const prevYM = prevYmStr(year, month);

  const rows = await fetchAll("stocktakes", (q) =>
    q.eq("store", store).eq("location", location).in("yearMonth", [yearMonth, prevYM]));
  const prevEntries = rows.filter((r) => str(r.yearMonth) === prevYM);
  if (!prevEntries.length) return { success: true, copied: 0 };

  const existing: Record<string, boolean> = {};
  rows.forEach((r) => {
    if (str(r.yearMonth) === yearMonth) {
      existing[str(r.productName).trim().toLowerCase()] = true;
    }
  });

  const toInsert: Row[] = [];
  prevEntries.forEach((e) => {
    const key = str(e.productName).trim().toLowerCase();
    if (existing[key]) return;
    toInsert.push({
      id: uuid(),
      store,
      location,
      yearMonth,
      itemId: str(e.itemId),
      category: str(e.category),
      productName: e.productName,
      unit: str(e.unit),
      vendor: str(e.vendor),
      unitPrice: _toNum(e.unitPrice),
      quantity: 0,
      amount: 0,
      note: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  });
  if (toInsert.length) {
    const { error } = await supabase.from("stocktakes").insert(toInsert);
    if (error) throw new Error("stocktakes insert: " + error.message);
  }
  return { success: true, copied: toInsert.length };
}

// ----------------------------------------------------------------
// Router
// ----------------------------------------------------------------
const HANDLERS: Record<string, (body: Row) => Promise<unknown>> = {
  register: registerUser,
  login: loginUser,
  listUsers,
  deleteUser,
  getUser,
  updateUser,
  record: recordAttendance,
  getStatus,
  listAttendance,
  addAttendance,
  updateAttendance,
  getAttendanceSummary,
  listUnclosedPunches,
  deleteAttendance,
  registerShift,
  listShifts,
  deleteShift,
  getPatterns,
  savePatterns,
  listPositions,
  registerPosition,
  updatePosition,
  deletePosition,
  listShiftBudgets,
  upsertShiftBudget,
  listPurchases,
  registerPurchase,
  registerPurchaseBatch,
  deletePurchase,
  listPettyCash,
  registerPettyCash,
  registerPettyCashBatch,
  deletePettyCash,
  listStores,
  listVendors,
  listProductNames,
  listStoreMaster,
  registerStore,
  deleteStore,
  listVendorMaster,
  registerVendor,
  deleteVendor,
  listDailySales,
  upsertDailySales,
  deleteDailySales,
  getMonthlyTarget,
  upsertMonthlyTarget,
  updateMonthlyLaborCost,
  getDashboard,
  listLocations,
  registerLocation,
  deleteLocation,
  listInventoryItems,
  registerInventoryItem,
  deleteInventoryItem,
  listStocktakeSummary,
  listStocktakeEntries,
  upsertStocktakeEntry,
  deleteStocktakeEntry,
  copyStocktakeFromPrevMonth,
  // フロントのウォームアップ用 ping
  __ping__: async () => ({ success: true, message: "pong" }),
};

function jsonResponse(obj: unknown): Response {
  return new Response(JSON.stringify(obj), {
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method === "GET") {
    return jsonResponse({ success: true, message: "Attendance API is running." });
  }

  let body: Row = {};
  try {
    body = await req.json();
  } catch (_e) {
    return jsonResponse({ success: false, message: "Invalid JSON" });
  }

  const action = str(body.action);
  const handler = HANDLERS[action];
  if (!handler) {
    return jsonResponse({ success: false, message: "Unknown action: " + action });
  }

  try {
    const result = await handler(body);
    return jsonResponse(result);
  } catch (err) {
    console.error(action, err);
    return jsonResponse({ success: false, message: String(err) });
  }
});
