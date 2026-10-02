/**
 * ============================================================
 *  Supabase → スプレッドシート 自動転記 (ミラー/バックアップ)
 * ============================================================
 *
 *  Supabase (vietnam-kintai) の全データを、このスクリプトを
 *  バインドしたスプレッドシートへ定期的に丸ごと転記します。
 *  転記は毎回「全消去 → 全書き込み」なので、Supabase側の
 *  追加・修正・削除がそのまま反映されます (一方向ミラー)。
 *
 *  ※ このシートは閲覧・集計用です。シートを編集しても
 *     Supabaseには反映されません (入力は必ずアプリから)。
 *
 * ──────────────────────────────────────────
 *  セットアップ手順
 * ──────────────────────────────────────────
 *  1. https://sheets.google.com で【新しい】スプレッドシートを作成
 *     (名前例:「Vietnam勤怠DB_ミラー」)
 *     ※ 旧「Vietnam勤怠DB」には絶対にバインドしないこと。
 *       タブが同名のため旧データが上書き消去されます。
 *  2. 拡張機能 → Apps Script を開き、このファイルの内容を貼り付け
 *  3. 下の EXPORT_TOKEN にトークンを貼る (別途共有された値。
 *     セキュリティのためこのファイルには含めていません)
 *  4. エディタで関数 `syncAll` を選んで一度実行 (初回は権限承認)
 *     → シートに全テーブルが転記されることを確認
 *  5. 関数 `setupTrigger` を一度実行
 *     → 以後 1時間ごと に自動同期されます (間隔は下の定数で変更可)
 *
 *  手動で同期したいとき: シートのメニュー「🔄 Supabase同期」
 *  自動同期を止めたいとき: 関数 `removeTrigger` を実行
 * ============================================================
 */

// ---- 接続設定 -------------------------------------------------
var EXPORT_URL = "https://yczwdkkuaitlbvtskmsf.supabase.co/functions/v1/import-tmp";
var API_URL    = "https://yczwdkkuaitlbvtskmsf.supabase.co/functions/v1/api";

// エクスポートAPIのアクセストークン。リポジトリには含めないこと。
var EXPORT_TOKEN = "PASTE_TOKEN_HERE";

// 自動同期の間隔 (時間)。1, 2, 4, 6, 8, 12 のいずれか。
var SYNC_INTERVAL_HOURS = 1;

// ---- 転記対象テーブル (タブ名・列順は旧スプレッドシートに準拠) ----
var TABLES = [
  { table: "users", sheet: "Users", cols: [
    "id", "name", "email", "passwordHash", "createdAt", "role", "phone",
    "birthDate", "gender", "idNumber", "address", "hireDate",
    "emergencyContact", "bankName", "bankBranch", "bankAccount",
    "hourlyRate", "dailyRate", "store",
    "salaryForm", "salary", "transportationExpenses", "parkingFee",
    "distanceFromStoreKm", "storeLocation",
    "socialInsuranceRate", "socialInsurance", "otherAllowance", "allowanceNote",
  ]},
  { table: "attendance", sheet: "Attendance", cols: [
    "id", "userId", "type", "timestamp", "date", "name", "role", "store",
  ]},
  { table: "shifts", sheet: "Shifts", cols: [
    "id", "userId", "userName", "date", "startTime", "endTime",
    "note", "createdAt", "store", "position",
  ]},
  { table: "shift_patterns", sheet: "ShiftPatterns", cols: [
    "id", "name", "startTime", "endTime", "color",
  ]},
  { table: "purchases", sheet: "Purchases", cols: [
    "id", "store", "date", "vendor", "productName", "specification",
    "category", "unitPrice", "quantity", "taxRate", "paymentMethod",
    "method", "note", "createdAt", "paymentStatus",
  ]},
  { table: "petty_cash", sheet: "PettyCash", cols: [
    "id", "store", "date", "type", "category", "subCategory",
    "productName", "amount", "taxRate", "paymentMethod", "vendor",
    "taxCode", "note", "createdAt", "unitPrice", "quantity",
  ]},
  { table: "stores", sheet: "Stores", cols: [
    "id", "name", "address", "phone", "note", "createdAt",
  ]},
  { table: "vendors", sheet: "Vendors", cols: [
    "id", "name", "taxCode", "address", "phone", "note", "createdAt",
  ]},
  { table: "daily_sales", sheet: "DailySales", cols: [
    "id", "store", "date", "foodSales", "drinkSales", "otherSales",
    "customers", "note", "createdAt", "totalSalesIncl", "totalSalesExcl",
    "foodSalesIncl", "foodSalesExcl", "drinkSalesIncl", "drinkSalesExcl",
    "paymentCash", "paymentQr", "paymentCard", "discountAmount",
    "depositAmount", "pettyCashAmount",
  ]},
  { table: "monthly_targets", sheet: "MonthlyTargets", cols: [
    "id", "store", "yearMonth", "foodSalesTarget", "drinkSalesTarget",
    "otherSalesTarget", "foodCostRatioTarget", "drinkCostRatioTarget",
    "laborCostRatioTarget", "monthlyLaborCost", "note", "createdAt",
  ]},
  { table: "locations", sheet: "Locations", cols: [
    "id", "store", "name", "sortOrder", "createdAt",
  ]},
  { table: "inventory_items", sheet: "InventoryItems", cols: [
    "id", "store", "category", "productName", "unit", "lastUnitPrice",
    "lastVendor", "archived", "createdAt", "updatedAt", "lastPurchaseDate",
  ]},
  { table: "stocktakes", sheet: "Stocktakes", cols: [
    "id", "store", "location", "yearMonth", "itemId", "category",
    "productName", "unit", "vendor", "unitPrice", "quantity", "amount",
    "note", "createdAt", "updatedAt",
  ]},
];

// ============================================================
// メイン: 全テーブルを転記
// ============================================================
function syncAll() {
  if (!EXPORT_TOKEN || EXPORT_TOKEN.indexOf("PASTE_") === 0) {
    throw new Error("EXPORT_TOKEN を設定してください (別途共有されたトークン)");
  }
  var results = [];
  var startedAt = new Date();

  var cache = {}; // AttendanceLog 生成用に users / attendance を使い回す
  TABLES.forEach(function (def) {
    var rows = fetchExport_(def.table);
    cache[def.table] = rows;
    writeSheet_(def.sheet, def.cols, rows.map(function (r) {
      return def.cols.map(function (c) {
        var v = r[c];
        return v === null || v === undefined ? "" : v;
      });
    }));
    results.push([def.sheet, rows.length]);
  });

  // ポジションマスタと日別売上予算は公開APIから取得
  results.push(["Positions", syncPositions_()]);
  results.push(["ShiftBudgets", syncShiftBudgets_()]);

  // 旧シートの AttendanceLog と同形式の日別勤怠ログを打刻から生成
  results.push(["AttendanceLog",
    syncAttendanceLog_(cache["users"] || [], cache["attendance"] || [])]);

  writeStatus_(startedAt, results);
  Logger.log("Sync done: " + JSON.stringify(results));
}

// ---- Supabase エクスポートAPI --------------------------------
function fetchExport_(table) {
  var res = UrlFetchApp.fetch(EXPORT_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({ token: EXPORT_TOKEN, table: table }),
    muteHttpExceptions: true,
  });
  if (res.getResponseCode() !== 200) {
    throw new Error(table + ": HTTP " + res.getResponseCode());
  }
  var body = JSON.parse(res.getContentText());
  if (!body.success) throw new Error(table + ": " + body.message);
  return body.rows || [];
}

function fetchApi_(payload) {
  var res = UrlFetchApp.fetch(API_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  return JSON.parse(res.getContentText());
}

// ---- ポジションマスタ -----------------------------------------
function syncPositions_() {
  var r = fetchApi_({ action: "listPositions", store: "" });
  var rows = (r.positions || []).map(function (p) {
    return [p.id, p.store, p.name, p.color, p.modelHours, p.sortOrder];
  });
  writeSheet_("Positions",
    ["id", "store", "name", "color", "modelHours", "sortOrder"], rows);
  return rows.length;
}

// ---- 日別売上予算 (2026-09 以降〜当月を店舗ごとに取得) ----------
function syncShiftBudgets_() {
  var stores = (fetchApi_({ action: "listStores" }).stores) || [];
  var rows = [];
  var now = new Date();
  var y = 2026, m = 9; // 予算機能の開始月
  while (y < now.getFullYear() ||
         (y === now.getFullYear() && m <= now.getMonth() + 1)) {
    stores.forEach(function (store) {
      var r = fetchApi_({
        action: "listShiftBudgets", store: store, year: y, month: m,
      });
      var budgets = (r && r.budgets) || {};
      Object.keys(budgets).sort().forEach(function (date) {
        if (budgets[date]) rows.push([store, date, budgets[date]]);
      });
    });
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }
  writeSheet_("ShiftBudgets", ["store", "date", "salesBudget"], rows);
  return rows.length;
}

// ============================================================
// AttendanceLog: 日別×従業員別の勤怠整形ログ (旧シートと同形式)
//  - 出勤→退勤のペアを最大3回まで列に展開 (スプリットシフト対応)
//  - 休憩は合計分数 + 最初の休憩開始/最後の休憩終了
//  - 深夜跨ぎは出勤打刻した日の行に計上 (アプリの集計と同じ)
//  - 退勤忘れは ClockIn のみ記録し労働時間に含めない
//  - ActualHours = 拘束時間 − 休憩 / OvertimeHours = 8h 超過分
//  - DailyPay   = 日給者: dailyRate / 時給者: ActualHours × hourlyRate
// ============================================================
var ATTLOG_TZ = "GMT+7";
var ATTLOG_OVERTIME_AFTER_HOURS = 8; // 残業とみなす閾値 (h/日)

function syncAttendanceLog_(users, punches) {
  var userMap = {};
  users.forEach(function (u) { userMap[String(u.id)] = u; });

  // ユーザーごとに時系列へ整列
  var byUser = {};
  punches.forEach(function (p) {
    var ts = new Date(p.timestamp);
    if (isNaN(ts.getTime())) return;
    var uid = String(p.userId);
    (byUser[uid] = byUser[uid] || []).push({ p: p, ts: ts });
  });

  var days = {}; // "date|uid" -> rec
  Object.keys(byUser).forEach(function (uid) {
    var evs = byUser[uid].sort(function (a, b) { return a.ts - b.ts; });
    var cur = null;
    function dayRec(inTs, store) {
      var day = Utilities.formatDate(inTs, ATTLOG_TZ, "yyyy-MM-dd");
      var key = day + "|" + uid;
      if (!days[key]) {
        days[key] = { date: day, uid: uid, store: store, pairs: [],
                      breakMs: 0, firstBreak: null, lastBreak: null };
      }
      return days[key];
    }
    evs.forEach(function (e) {
      var type = e.p.type;
      if (type === "clock_in") {
        // 直前の退勤忘れがあれば ClockIn のみの記録として確定
        if (cur) {
          var r0 = dayRec(cur.inTs, cur.store);
          r0.pairs.push([cur.inTs, null]);
        }
        var u = userMap[uid] || {};
        cur = { inTs: e.ts, store: e.p.store || u.store || "",
                breakMs: 0, breakStart: null, firstBreak: null, lastBreak: null };
      } else if (type === "break_start" && cur) {
        cur.breakStart = e.ts;
        if (!cur.firstBreak) cur.firstBreak = e.ts;
      } else if (type === "break_end" && cur && cur.breakStart) {
        cur.breakMs += e.ts - cur.breakStart;
        cur.lastBreak = e.ts;
        cur.breakStart = null;
      } else if (type === "clock_out" && cur) {
        var r = dayRec(cur.inTs, cur.store);
        r.pairs.push([cur.inTs, e.ts]);
        r.breakMs += cur.breakMs;
        if (cur.firstBreak && !r.firstBreak) r.firstBreak = cur.firstBreak;
        if (cur.lastBreak) r.lastBreak = cur.lastBreak;
        cur = null;
      }
    });
    if (cur) {
      var rz = dayRec(cur.inTs, cur.store);
      rz.pairs.push([cur.inTs, null]);
    }
  });

  // "u" パターン: 1=月曜 … 7=日曜 (GMT+7 固定で評価)
  var WD = ["", "T2", "T3", "T4", "T5", "T6", "T7", "CN"];
  var hhmm = function (ts) {
    return ts ? Utilities.formatDate(ts, ATTLOG_TZ, "HH:mm") : "";
  };
  var now = Utilities.formatDate(new Date(), ATTLOG_TZ, "yyyy-MM-dd'T'HH:mm:ss'+07:00'");

  var recs = Object.keys(days).map(function (k) { return days[k]; });
  recs.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    var na = (userMap[a.uid] || {}).name || "";
    var nb = (userMap[b.uid] || {}).name || "";
    return na < nb ? -1 : na > nb ? 1 : 0;
  });

  var rows = recs.map(function (r) {
    var u = userMap[r.uid] || {};
    var grossMs = 0;
    r.pairs.forEach(function (pr) {
      if (pr[1]) grossMs += pr[1] - pr[0];
    });
    var workH = grossMs / 3600000;
    var actualH = Math.max(0, (grossMs - r.breakMs) / 3600000);
    var overH = Math.max(0, actualH - ATTLOG_OVERTIME_AFTER_HOURS);
    var hourly = Number(u.hourlyRate) || 0;
    var daily = Number(u.dailyRate) || 0;
    var pay = daily > 0 ? daily : Math.round(actualH * hourly);
    var salaryForm = u.salaryForm ||
      (daily > 0 ? "Daily" : (hourly > 0 ? "Hourly wage" : ""));
    var wd = WD[Number(Utilities.formatDate(
      new Date(r.date + "T12:00:00+07:00"), ATTLOG_TZ, "u"))] || "";
    var note = r.pairs.length > 3 ? ("+" + (r.pairs.length - 3) + " ca") : "";
    var p = r.pairs;
    return [
      r.date, wd, r.store, r.uid, u.name || "", u.role || "", salaryForm,
      hhmm(p[0] && p[0][0]), hhmm(p[0] && p[0][1]),
      hhmm(p[1] && p[1][0]), hhmm(p[1] && p[1][1]),
      hhmm(p[2] && p[2][0]), hhmm(p[2] && p[2][1]),
      hhmm(r.firstBreak), hhmm(r.lastBreak),
      String(Math.round(r.breakMs / 60000)),
      workH.toFixed(2), actualH.toFixed(2), overH.toFixed(2),
      String(hourly), String(pay), note, now,
    ];
  });

  writeSheet_("AttendanceLog", [
    "Date", "Weekday", "Store", "UserID", "Name", "Role", "SalaryForm",
    "ClockIn1", "ClockOut1", "ClockIn2", "ClockOut2", "ClockIn3", "ClockOut3",
    "BreakStart", "BreakEnd", "BreakMinutes",
    "WorkHours", "ActualHours", "OvertimeHours",
    "HourlyRate", "DailyPay", "Note", "UpdatedAt",
  ], rows);
  return rows.length;
}

// ---- シート書き込み (全消去 → ヘッダー + 全行) ------------------
function writeSheet_(name, header, rows) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  sheet.clearContents();

  var nRows = rows.length + 1;
  var nCols = header.length;
  // "22:00" や "2026-09-01" が Date に自動変換されて日時ズレを起こさない
  // よう、書き込み範囲をテキスト書式にしてから書く (旧Code.gsと同じ対策)
  sheet.getRange(1, 1, nRows, nCols).setNumberFormat("@");

  var values = [header].concat(rows.map(function (r) {
    return r.map(function (v) {
      return v === null || v === undefined ? "" : String(v);
    });
  }));
  sheet.getRange(1, 1, nRows, nCols).setValues(values);

  sheet.getRange(1, 1, 1, nCols)
    .setFontWeight("bold")
    .setBackground("#1f2937")
    .setFontColor("#ffffff");
  sheet.setFrozenRows(1);
}

// ---- 同期ステータスタブ ---------------------------------------
function writeStatus_(startedAt, results) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("同期情報") || ss.insertSheet("同期情報", 0);
  sheet.clearContents();
  var tz = ss.getSpreadsheetTimeZone();
  var values = [
    ["Supabase → スプレッドシート ミラー (読み取り専用)", ""],
    ["最終同期", Utilities.formatDate(new Date(), tz, "yyyy-MM-dd HH:mm:ss")],
    ["所要時間(秒)", String(Math.round((new Date() - startedAt) / 1000))],
    ["", ""],
    ["タブ", "行数"],
  ].concat(results.map(function (r) { return [r[0], String(r[1])]; }));
  sheet.getRange(1, 1, values.length, 2).setValues(values);
  sheet.getRange(1, 1, 1, 2).setFontWeight("bold");
  sheet.getRange(5, 1, 1, 2).setFontWeight("bold");
}

// ============================================================
// トリガー管理
// ============================================================
function setupTrigger() {
  removeTrigger();
  ScriptApp.newTrigger("syncAll")
    .timeBased()
    .everyHours(SYNC_INTERVAL_HOURS)
    .create();
  Logger.log("Trigger installed: syncAll every " + SYNC_INTERVAL_HOURS + "h");
}

function removeTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "syncAll") ScriptApp.deleteTrigger(t);
  });
}

// ---- シートを開いたときのメニュー ------------------------------
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("🔄 Supabase同期")
      .addItem("今すぐ同期", "syncAll")
      .addToUi();
  } catch (e) { /* UI無しコンテキスト */ }
}
