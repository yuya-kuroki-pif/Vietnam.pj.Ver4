/**
 * Attendance system backend (Google Apps Script)
 * Database: Google Sheets bound to this script.
 *
 * Sheets:
 *   Users: [id, name, email, passwordHash, createdAt, role,
 *           phone, birthDate, gender, idNumber,
 *           address, hireDate, emergencyContact,
 *           bankName, bankBranch, bankAccount]
 *   Attendance: [id, userId, type, timestamp, date]
 *   Shifts:     [id, userId, userName, date, startTime, endTime, note, createdAt]
 *
 * type values:   clock_in | clock_out | break_start | break_end
 * role values:   admin | employee | parttime
 * gender values: male | female | other
 */

var USER_COLUMNS = [
  "id", "name", "email", "passwordHash", "createdAt", "role",
  "phone", "birthDate", "gender", "idNumber",
  "address", "hireDate", "emergencyContact",
  "bankName", "bankBranch", "bankAccount",
  "hourlyRate", "dailyRate", "store"
];

var TIMEZONE = "Asia/Ho_Chi_Minh"; // Vietnam timezone
var USERS_SHEET = "Users";
var ATT_SHEET = "Attendance";
var SHIFTS_SHEET = "Shifts";
var PATTERNS_SHEET = "ShiftPatterns";
var PURCHASES_SHEET = "Purchases";
var PETTY_SHEET = "PettyCash";
var STORES_SHEET = "Stores";
var VENDORS_SHEET = "Vendors";
var DAILY_SALES_SHEET = "DailySales";
var MONTHLY_TARGETS_SHEET = "MonthlyTargets";
var LOCATIONS_SHEET = "Locations";
var INVENTORY_ITEMS_SHEET = "InventoryItems";
var STOCKTAKES_SHEET = "Stocktakes";

var ATTENDANCE_COLUMNS = [
  "id", "userId", "type", "timestamp", "date", "name", "role"
];

var DAILY_SALES_COLUMNS = [
  "id", "store", "date",
  "foodSales", "drinkSales", "otherSales",
  "customers", "note", "createdAt",
  "totalSalesIncl", "totalSalesExcl",
  "foodSalesIncl", "foodSalesExcl",
  "drinkSalesIncl", "drinkSalesExcl",
  "paymentCash", "paymentQr", "paymentCard",
  "discountAmount", "depositAmount", "pettyCashAmount"
];

var PURCHASE_COLUMNS = [
  "id", "store", "date", "vendor", "productName", "specification",
  "category", "unitPrice", "quantity", "taxRate", "paymentMethod",
  "method", "note", "createdAt", "paymentStatus"
];

// 仕入れの科目。CSV(Theo dõi hoá đơn)の "Danh Mục" と同じ粒度に揃えてある。
// food / drink 以外はダッシュボードの原価計算では「その他原価」に集約される。
var PURCHASE_CATEGORIES = [
  "food", "drink", "consumables", "serviceFee", "staffMeal", "equipment", "other"
];

// 仕入れの支払状況。空文字は「未設定」。
var PAYMENT_STATUSES = ["paid", "unpaid"];

var PETTY_COLUMNS = [
  "id", "store", "date", "type", "category", "subCategory", "productName",
  "amount", "taxRate", "paymentMethod", "vendor", "taxCode", "note", "createdAt",
  "unitPrice", "quantity"
];

var STOCKTAKE_COLUMNS = [
  "id", "store", "location", "yearMonth", "itemId",
  "category", "productName", "unit", "vendor", "unitPrice",
  "quantity", "amount", "note", "createdAt", "updatedAt"
];

var INVENTORY_ITEMS_COLUMNS = [
  "id", "store", "category", "productName", "unit",
  "lastUnitPrice", "lastVendor", "archived",
  "createdAt", "updatedAt", "lastPurchaseDate"
];

// Default 3 shift patterns inserted when the sheet is first created.
// Each pattern has a stable id (P1/P2/P3) so it can be referenced.
var DEFAULT_PATTERNS = [
  ["P1", "Ca sáng / 早番", "08:00", "17:00", "#2563eb"],
  ["P2", "Ca chiều / 遅番", "13:00", "22:00", "#d97706"],
  ["P3", "Ca đêm / 夜勤",   "22:00", "06:00", "#7c3aed"],
];

// ----------------------------------------------------------------
// Web App entry point
// ----------------------------------------------------------------
function doPost(e) {
  var body = {};
  try {
    body = JSON.parse(e.postData.contents);
  } catch (err) {
    return jsonResponse({ success: false, message: "Invalid JSON" });
  }

  var action = body.action;
  var result;
  try {
    switch (action) {
      case "register":
        result = registerUser(body);
        break;
      case "login":
        result = loginUser(body);
        break;
      case "listUsers":
        result = listUsers(body);
        break;
      case "deleteUser":
        result = deleteUser(body);
        break;
      case "record":
        result = recordAttendance(body);
        break;
      case "getStatus":
        result = getStatus(body);
        break;
      case "listAttendance":
        result = listAttendance(body);
        break;
      case "addAttendance":
        result = addAttendance(body);
        break;
      case "updateAttendance":
        result = updateAttendance(body);
        break;
      case "deleteAttendance":
        result = deleteAttendance(body);
        break;
      case "registerShift":
        result = registerShift(body);
        break;
      case "listShifts":
        result = listShifts(body);
        break;
      case "deleteShift":
        result = deleteShift(body);
        break;
      case "getPatterns":
        result = getPatterns(body);
        break;
      case "savePatterns":
        result = savePatterns(body);
        break;
      case "listPurchases":
        result = listPurchases(body);
        break;
      case "registerPurchase":
        result = registerPurchase(body);
        break;
      case "registerPurchaseBatch":
        result = registerPurchaseBatch(body);
        break;
      case "deletePurchase":
        result = deletePurchase(body);
        break;
      case "listPettyCash":
        result = listPettyCash(body);
        break;
      case "registerPettyCash":
        result = registerPettyCash(body);
        break;
      case "registerPettyCashBatch":
        result = registerPettyCashBatch(body);
        break;
      case "deletePettyCash":
        result = deletePettyCash(body);
        break;
      case "listStores":
        result = listStores(body);
        break;
      case "listVendors":
        result = listVendors(body);
        break;
      case "listProductNames":
        result = listProductNames(body);
        break;
      case "listStoreMaster":
        result = listStoreMaster(body);
        break;
      case "registerStore":
        result = registerStore(body);
        break;
      case "deleteStore":
        result = deleteStore(body);
        break;
      case "listVendorMaster":
        result = listVendorMaster(body);
        break;
      case "registerVendor":
        result = registerVendor(body);
        break;
      case "deleteVendor":
        result = deleteVendor(body);
        break;
      case "listDailySales":
        result = listDailySales(body);
        break;
      case "upsertDailySales":
        result = upsertDailySales(body);
        break;
      case "deleteDailySales":
        result = deleteDailySales(body);
        break;
      case "getMonthlyTarget":
        result = getMonthlyTarget(body);
        break;
      case "upsertMonthlyTarget":
        result = upsertMonthlyTarget(body);
        break;
      case "updateMonthlyLaborCost":
        result = updateMonthlyLaborCost(body);
        break;
      case "getDashboard":
        result = getDashboard(body);
        break;
      case "listLocations":
        result = listLocations(body);
        break;
      case "registerLocation":
        result = registerLocation(body);
        break;
      case "deleteLocation":
        result = deleteLocation(body);
        break;
      case "listInventoryItems":
        result = listInventoryItems(body);
        break;
      case "registerInventoryItem":
        result = registerInventoryItem(body);
        break;
      case "deleteInventoryItem":
        result = deleteInventoryItem(body);
        break;
      case "listStocktakeSummary":
        result = listStocktakeSummary(body);
        break;
      case "listStocktakeEntries":
        result = listStocktakeEntries(body);
        break;
      case "upsertStocktakeEntry":
        result = upsertStocktakeEntry(body);
        break;
      case "deleteStocktakeEntry":
        result = deleteStocktakeEntry(body);
        break;
      case "copyStocktakeFromPrevMonth":
        result = copyStocktakeFromPrevMonth(body);
        break;
      default:
        result = { success: false, message: "Unknown action: " + action };
    }
  } catch (err) {
    result = { success: false, message: String(err) };
  }
  return jsonResponse(result);
}

function doGet() {
  return jsonResponse({ success: true, message: "Attendance API is running." });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// ----------------------------------------------------------------
// Sheet helpers
// ----------------------------------------------------------------
// Cache the active spreadsheet object — it's the same instance for the
// whole script execution, but calling getActiveSpreadsheet() repeatedly
// has a small but measurable cost.
var _SS_CACHE = null;
function _activeSS() {
  if (!_SS_CACHE) _SS_CACHE = SpreadsheetApp.getActiveSpreadsheet();
  return _SS_CACHE;
}

// Track sheets that have already been "prepared" (text-formatted +
// migrations run) within this script execution. Subsequent getSheet
// calls return the sheet immediately, skipping all the expensive setup.
var _PREPARED = {};

function getSheet(name) {
  var ss = _activeSS();
  var sheet = ss.getSheetByName(name);
  var freshlyCreated = false;
  if (!sheet) {
    sheet = ss.insertSheet(name);
    freshlyCreated = true;
    if (name === USERS_SHEET) {
      sheet.appendRow(USER_COLUMNS);
      sheet.getRange(1, 1, 1, USER_COLUMNS.length).setFontWeight("bold");
    } else if (name === ATT_SHEET) {
      sheet.appendRow(ATTENDANCE_COLUMNS);
    } else if (name === SHIFTS_SHEET) {
      sheet.appendRow(["id", "userId", "userName", "date", "startTime", "endTime", "note", "createdAt"]);
    } else if (name === PATTERNS_SHEET) {
      sheet.appendRow(["id", "name", "startTime", "endTime", "color"]);
    } else if (name === PURCHASES_SHEET) {
      sheet.appendRow(PURCHASE_COLUMNS);
    } else if (name === PETTY_SHEET) {
      sheet.appendRow(PETTY_COLUMNS);
    } else if (name === STORES_SHEET) {
      sheet.appendRow(["id", "name", "address", "phone", "note", "createdAt"]);
    } else if (name === VENDORS_SHEET) {
      sheet.appendRow(["id", "name", "taxCode", "address", "phone", "note", "createdAt"]);
    } else if (name === DAILY_SALES_SHEET) {
      sheet.appendRow(DAILY_SALES_COLUMNS);
    } else if (name === MONTHLY_TARGETS_SHEET) {
      sheet.appendRow([
        "id", "store", "yearMonth",
        "foodSalesTarget", "drinkSalesTarget", "otherSalesTarget",
        "foodCostRatioTarget", "drinkCostRatioTarget", "laborCostRatioTarget",
        "monthlyLaborCost", "note", "createdAt"
      ]);
    } else if (name === LOCATIONS_SHEET) {
      sheet.appendRow(["id", "store", "name", "sortOrder", "createdAt"]);
    } else if (name === INVENTORY_ITEMS_SHEET) {
      sheet.appendRow(INVENTORY_ITEMS_COLUMNS);
    } else if (name === STOCKTAKES_SHEET) {
      sheet.appendRow(STOCKTAKE_COLUMNS);
    }
  }

  // Fast path: if we've already prepared this sheet within this script
  // execution, skip all the expensive setup below. This caps the cost at
  // one full preparation per request, regardless of how many times
  // getSheet(name) is called.
  if (_PREPARED[name]) return sheet;

  // Apply text format ONLY to freshly-created sheets — once on creation.
  // For existing sheets we rely on per-row `writeTextRow` (which sets @ on
  // the target row before writing). Running setNumberFormat over the entire
  // sheet (1000+ rows × N cols) on every cold start was a major source of
  // request latency. Users who want to re-apply text format on existing
  // sheets can run the manual "📋 全シートを整形" menu (formatAllSheets).
  if (freshlyCreated && sheet.getMaxColumns() > 0) {
    sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).setNumberFormat("@");
  }

  if (name === PATTERNS_SHEET) {
    // Insert default rows after text format is applied so the time strings
    // ("22:00" / "06:00" for the night shift) remain as plain text.
    if (freshlyCreated) {
      for (var p = 0; p < DEFAULT_PATTERNS.length; p++) {
        sheet.appendRow(DEFAULT_PATTERNS[p]);
      }
    } else if (sheet.getLastRow() < 4) {
      // Re-seed any missing default pattern rows.
      var existingIds = {};
      if (sheet.getLastRow() >= 2) {
        var ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getValues();
        ids.forEach(function (r) { existingIds[String(r[0])] = true; });
      }
      DEFAULT_PATTERNS.forEach(function (p) {
        if (!existingIds[p[0]]) sheet.appendRow(p);
      });
    }
    // Self-heal: if any time cell is a Date (legacy data from before the
    // text-format fix), rewrite it as plain text in spreadsheet local time.
    healPatternTimes(sheet);
  }
  if (name === USERS_SHEET) {
    ensureUserColumns(sheet);
  }
  if (name === SHIFTS_SHEET) {
    healShiftDates(sheet);
  }
  if (name === ATT_SHEET) {
    ensureColumns(sheet, ATTENDANCE_COLUMNS);
  }
  if (name === DAILY_SALES_SHEET) {
    ensureColumns(sheet, DAILY_SALES_COLUMNS);
  }
  if (name === PURCHASES_SHEET) {
    ensureColumns(sheet, PURCHASE_COLUMNS);
  }
  if (name === PETTY_SHEET) {
    ensureColumns(sheet, PETTY_COLUMNS);
  }
  if (name === STOCKTAKES_SHEET) {
    ensureColumns(sheet, STOCKTAKE_COLUMNS);
  }
  if (name === INVENTORY_ITEMS_SHEET) {
    ensureColumns(sheet, INVENTORY_ITEMS_COLUMNS);
  }

  _PREPARED[name] = true;
  return sheet;
}

// Generic column migration: add any header from `expected` that is missing.
// Existing data rows keep their values; the new column is appended at the right.
function ensureColumns(sheet, expected) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    sheet.appendRow(expected);
    return;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < expected.length; i++) {
    if (headers.indexOf(expected[i]) !== -1) continue;
    var newColIdx = sheet.getLastColumn() + 1;
    sheet.getRange(1, newColIdx).setValue(expected[i]);
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
}

// Returns the spreadsheet's configured timezone (used for round-tripping
// time-only Date values that Sheets created from a text input).
function getSpreadsheetTz() {
  return SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone();
}

// Convert any Date-typed cells in the Shifts sheet's date column to plain
// text "yyyy-MM-dd" using the spreadsheet's TZ. Prevents the "shift jumps
// to next/previous day" bug that happens when a date was auto-parsed as
// a Date by Sheets and then read back through a mismatched timezone.
function healShiftDates(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var dateCol = headers.indexOf("date") + 1;
  if (dateCol < 1) return;
  var range = sheet.getRange(2, dateCol, lastRow - 1, 1);
  var values = range.getValues();
  var changed = false;
  var tz = getSpreadsheetTz();
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] instanceof Date) {
      values[i][0] = Utilities.formatDate(values[i][0], tz, "yyyy-MM-dd");
      changed = true;
    }
  }
  if (changed) range.setValues(values);
}

// Convert any Date-typed cells in the pattern sheet's time columns back to
// plain text strings so the values match exactly what registerShift saves.
function healPatternTimes(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  var range = sheet.getRange(2, 3, lastRow - 1, 2); // C: startTime, D: endTime
  var values = range.getValues();
  var changed = false;
  var tz = getSpreadsheetTz();
  for (var i = 0; i < values.length; i++) {
    for (var j = 0; j < 2; j++) {
      if (values[i][j] instanceof Date) {
        values[i][j] = Utilities.formatDate(values[i][j], tz, "HH:mm");
        changed = true;
      }
    }
  }
  if (changed) range.setValues(values);
}

// Auto-migrate existing Users sheets that are missing newer columns.
// Adds any missing columns from USER_COLUMNS while preserving existing data.
// When the legacy "role" column is added, promotes the first user to admin.
function ensureUserColumns(sheet) {
  var lastCol = sheet.getLastColumn();
  var lastRow = sheet.getLastRow();
  if (lastCol < 1) {
    sheet.appendRow(USER_COLUMNS);
    return;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  for (var i = 0; i < USER_COLUMNS.length; i++) {
    var col = USER_COLUMNS[i];
    if (headers.indexOf(col) !== -1) continue;

    var newColIdx = sheet.getLastColumn() + 1;
    sheet.getRange(1, newColIdx).setValue(col);

    if (col === "role" && lastRow > 1) {
      // Legacy migration: promote the first existing user to admin.
      sheet.getRange(2, newColIdx).setValue("admin");
      if (lastRow > 2) {
        var values = [];
        for (var j = 0; j < lastRow - 2; j++) values.push(["employee"]);
        sheet.getRange(3, newColIdx, values.length, 1).setValues(values);
      }
    }

    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
}

function findUserById(userId) {
  if (!userId) return null;
  var key = "user:" + String(userId);
  var cache = CacheService.getScriptCache();
  var cached = null;
  try { cached = cache.get(key); } catch (e) {}
  if (cached) {
    try { return JSON.parse(cached); } catch (e) {}
  }
  var sheet = getSheet(USERS_SHEET);
  var users = getAllRows(sheet);
  for (var i = 0; i < users.length; i++) {
    if (String(users[i].id) === String(userId)) {
      var u = users[i];
      // Build a compact JSON-safe snapshot (drops _rowIndex, Date objects).
      var compact = {
        id: String(u.id || ""),
        name: String(u.name || ""),
        email: String(u.email || ""),
        role: String(u.role || "") || "user",
        phone: String(u.phone || ""),
        store: String(u.store || ""),
        hourlyRate: _toNum(u.hourlyRate),
      };
      try { cache.put(key, JSON.stringify(compact), 300); } catch (e) {}
      return compact;
    }
  }
  return null;
}

// Helper used by mutations that change a user (delete / register) — drop
// the cached entry so the next read sees fresh data.
function _invalidateUserCache(userId) {
  if (!userId) return;
  try { CacheService.getScriptCache().remove("user:" + String(userId)); } catch (e) {}
}

function normalizeDate(v) {
  if (v instanceof Date) {
    // Use the SPREADSHEET's own timezone — when Sheets auto-parses a
    // string like "2026-05-03" it stores midnight in the spreadsheet TZ.
    // Formatting back with the same TZ round-trips correctly, even if
    // that TZ differs from this script's TIMEZONE constant.
    return Utilities.formatDate(v, getSpreadsheetTz(), "yyyy-MM-dd");
  }
  return String(v);
}

function normalizeTimestamp(v) {
  if (v instanceof Date) {
    return Utilities.formatDate(v, getSpreadsheetTz(), "yyyy-MM-dd'T'HH:mm:ssXXX");
  }
  return String(v);
}

function normalizeTime(v) {
  if (v instanceof Date) {
    // Use the spreadsheet's own timezone — a value Sheets parsed from a
    // text input like "22:00" was stored relative to that timezone, so
    // formatting back with the same TZ round-trips correctly.
    return Utilities.formatDate(v, getSpreadsheetTz(), "HH:mm");
  }
  var s = String(v);
  if (s.length >= 5 && s.charAt(2) === ":") return s.substring(0, 5);
  return s;
}

// Write `values` to a specific row, ensuring every cell is text-formatted
// BEFORE the value is written. The flush() call forces Sheets to apply the
// format first, otherwise some queued operations let "2026-05-11" be parsed
// as a Date (and then shift by ±1 day across timezones on read-back).
function writeTextRow(sheet, rowIndex, values) {
  var range = sheet.getRange(rowIndex, 1, 1, values.length);
  range.setNumberFormat("@");
  SpreadsheetApp.flush(); // ensure format is committed before writing values
  // setValues with all-string values + @ format → guaranteed plain-text cells.
  var stringified = values.map(function (v) {
    return v === null || v === undefined ? "" : String(v);
  });
  range.setValues([stringified]);
}

// Append a new row with text-format applied IN ADVANCE — same protection
// as writeTextRow, but for new rows.
function appendTextRow(sheet, values) {
  var newRowIdx = sheet.getLastRow() + 1;
  writeTextRow(sheet, newRowIdx, values);
  return newRowIdx;
}

// Read only the last `maxRows` data rows of a sheet (plus the header row to
// build the object keys). Assumes append-order = chronological order, which
// holds for this app (we always append-new-rows). Much faster than getAllRows
// when the sheet has thousands of rows but we only care about recent activity.
function getRecentRows(sheet, maxRows) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return [];
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var startRow = Math.max(2, lastRow - maxRows + 1);
  var numRows = lastRow - startRow + 1;
  var values = sheet.getRange(startRow, 1, numRows, lastCol).getValues();
  var rows = [];
  for (var i = 0; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    row._rowIndex = startRow + i;
    rows.push(row);
  }
  return rows;
}

function getAllRows(sheet) {
  var values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  var headers = values[0];
  var rows = [];
  for (var i = 1; i < values.length; i++) {
    var row = {};
    for (var j = 0; j < headers.length; j++) {
      row[headers[j]] = values[i][j];
    }
    row._rowIndex = i + 1; // 1-based sheet row
    rows.push(row);
  }
  return rows;
}

function uuid() {
  return Utilities.getUuid();
}

function hashPassword(password) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return raw
    .map(function (b) {
      var v = (b < 0 ? b + 256 : b).toString(16);
      return v.length === 1 ? "0" + v : v;
    })
    .join("");
}

function todayStr() {
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd");
}

function nowIso() {
  // Store as ISO string in Vietnam timezone for clarity
  return Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

// ----------------------------------------------------------------
// User: register
// ----------------------------------------------------------------
function registerUser(body) {
  var name = (body.name || "").toString().trim();
  var email = (body.email || "").toString().trim().toLowerCase();
  var password = (body.password || "").toString();
  var role = (body.role || "").toString().trim();

  if (!name) return { success: false, message: "Name required" };
  if (password && password.length < 6) {
    return { success: false, message: "Password too short" };
  }

  var validRoles = ["admin", "employee", "parttime"];
  if (!role || validRoles.indexOf(role) === -1) role = "employee";

  var validGenders = ["male", "female", "other", ""];
  var gender = (body.gender || "").toString().trim();
  if (validGenders.indexOf(gender) === -1) gender = "";

  var sheet = getSheet(USERS_SHEET);
  var users = getAllRows(sheet);
  if (email) {
    for (var i = 0; i < users.length; i++) {
      if (String(users[i].email).toLowerCase() === email) {
        return { success: false, code: "EMAIL_EXISTS", message: "Email already registered" };
      }
    }
  }

  var id = uuid();
  var passwordHash = password ? hashPassword(password) : "";

  // Build row in USER_COLUMNS order so it survives any future column reordering.
  var data = {
    id: id,
    name: name,
    email: email,
    passwordHash: passwordHash,
    createdAt: nowIso(),
    role: role,
    phone: (body.phone || "").toString().trim(),
    birthDate: (body.birthDate || "").toString().trim(),
    gender: gender,
    idNumber: (body.idNumber || "").toString().trim(),
    address: (body.address || "").toString().trim(),
    hireDate: (body.hireDate || "").toString().trim(),
    emergencyContact: (body.emergencyContact || "").toString().trim(),
    bankName: (body.bankName || "").toString().trim(),
    bankBranch: (body.bankBranch || "").toString().trim(),
    bankAccount: (body.bankAccount || "").toString().trim(),
    hourlyRate: _toNum(body.hourlyRate),
    dailyRate: _toNum(body.dailyRate),
    store: (body.store || "").toString().trim(),
  };
  var row = USER_COLUMNS.map(function (c) { return data[c] !== undefined && data[c] !== "" ? data[c] : ""; });
  sheet.appendRow(row);

  return {
    success: true,
    user: { id: id, name: name, email: email, role: role },
  };
}

// List all registered users (for the kiosk user picker AND master screen).
// Returns all user-facing fields; consumers cherry-pick what they need.
function listUsers(body) {
  var sheet = getSheet(USERS_SHEET);
  var users = getAllRows(sheet);
  var tz = getSpreadsheetTz();
  function asStr(v) {
    if (v === null || v === undefined) return "";
    if (v instanceof Date) return Utilities.formatDate(v, tz, "yyyy-MM-dd");
    return String(v).trim();
  }
  // Filter out blank/phantom rows: a real user must have an id or a name.
  var filtered = users.filter(function (u) {
    return asStr(u.id) !== "" || asStr(u.name) !== "";
  });
  filtered.sort(function (a, b) {
    var na = asStr(a.name).toLowerCase();
    var nb = asStr(b.name).toLowerCase();
    return na < nb ? -1 : na > nb ? 1 : 0;
  });
  return {
    success: true,
    users: filtered.map(function (u) {
      return {
        id: asStr(u.id),
        name: asStr(u.name),
        email: asStr(u.email),
        role: asStr(u.role),
        phone: asStr(u.phone),
        store: asStr(u.store),
        hourlyRate: _toNum(u.hourlyRate),
        dailyRate: _toNum(u.dailyRate),
        hireDate: asStr(u.hireDate),
      };
    }),
  };
}

function deleteUser(body) {
  var id = (body.id || "").toString();
  _invalidateUserCache(id);
  return _deleteFromSheet(USERS_SHEET, id);
}

// ----------------------------------------------------------------
// User: login
// ----------------------------------------------------------------
function loginUser(body) {
  var email = (body.email || "").toString().trim().toLowerCase();
  var password = (body.password || "").toString();
  if (!email || !password) {
    return { success: false, message: "Missing fields" };
  }

  var sheet = getSheet(USERS_SHEET);
  var users = getAllRows(sheet);
  var hash = hashPassword(password);

  for (var i = 0; i < users.length; i++) {
    if (
      String(users[i].email).toLowerCase() === email &&
      String(users[i].passwordHash) === hash
    ) {
      return {
        success: true,
        user: {
          id: users[i].id,
          name: users[i].name,
          email: users[i].email,
          role: users[i].role || "user",
        },
      };
    }
  }
  return { success: false, message: "Invalid credentials" };
}

// ----------------------------------------------------------------
// Attendance: record + status
// ----------------------------------------------------------------
// Returns the user's "current session" events:
//   - If there are events after the most recent clock_out (=ongoing shift),
//     return those. This is what makes 退勤忘れ recoverable: yesterday's
//     unfinished clock_in keeps the user in `in` state today, so the 退勤
//     button stays active and pairs with today's clock_out in payroll calc.
//   - Otherwise (no ongoing shift) return today's events for display.
// Note: never returns events from previous *completed* shifts on prior days,
// so the next day's clock_in is allowed as soon as midnight passes.
function getSessionLogs(userId) {
  var sheet = getSheet(ATT_SHEET);
  // Read only the most recent rows — enough to cover any user's ongoing
  // session + today + yesterday (退勤忘れ復帰用). 1000 rows ≒ a couple of
  // weeks of punches for a small team. Sessions older than that are
  // considered abandoned and don't matter for status derivation.
  var rows = getRecentRows(sheet, 1000);
  var today = todayStr();

  var userEvents = rows
    .filter(function (r) { return String(r.userId) === String(userId); })
    .sort(function (a, b) {
      return new Date(normalizeTimestamp(a.timestamp)) - new Date(normalizeTimestamp(b.timestamp));
    });

  // Find the position just after the most recent clock_out.
  // Everything after that index is the in-progress session.
  var startIdx = 0;
  for (var i = userEvents.length - 1; i >= 0; i--) {
    if (String(userEvents[i].type) === "clock_out") {
      startIdx = i + 1;
      break;
    }
  }

  var ongoing = userEvents.slice(startIdx);
  if (ongoing.length > 0) return ongoing;

  // No ongoing shift — show today's events for the kiosk log display.
  return userEvents.filter(function (r) {
    return normalizeDate(r.date) === today;
  });
}

function deriveStatus(todayLogs) {
  // Returns: out | in | break | finished
  if (!todayLogs.length) return "out";
  var last = todayLogs[todayLogs.length - 1];
  switch (last.type) {
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

// Enforce order: 出勤 → (休憩開始 → 休憩終了)* → 退勤. After clock_out (= finished)
// the user may start a new shift with clock_in (split shifts within the same day).
function isAllowedTransition(currentStatus, type) {
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

function recordAttendance(body) {
  var userId = (body.userId || "").toString();
  var type = (body.type || "").toString();
  if (!userId || !type) {
    return { success: false, message: "Missing fields" };
  }
  var allowed = ["clock_in", "clock_out", "break_start", "break_end"];
  if (allowed.indexOf(type) === -1) {
    return { success: false, message: "Invalid type" };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var todayLogs = getSessionLogs(userId);
    var status = deriveStatus(todayLogs);
    if (!isAllowedTransition(status, type)) {
      return {
        success: false,
        code: "INVALID_STATE",
        message: "Invalid transition: " + status + " -> " + type,
        status: status,
        todayLog: todayLogs.map(stripRow),
      };
    }

    var sheet = getSheet(ATT_SHEET);
    // Prefer name/role supplied by the client (kiosk already knows them from
    // the user picker) to skip a Users-sheet read entirely. Fall back to
    // findUserById only when the client didn't include them (older clients).
    var name = body.name !== undefined ? String(body.name || "") : "";
    var role = body.role !== undefined ? String(body.role || "") : "";
    if (!name && !role) {
      var user = findUserById(userId);
      if (user) {
        name = String(user.name || "");
        role = String(user.role || "");
      }
    }
    var newId = uuid();
    var newTs = nowIso();
    var newDate = todayStr();
    appendTextRow(sheet, [newId, userId, type, newTs, newDate, name, role]);

    // Simulate the new event in memory instead of re-reading the whole sheet.
    // This roughly halves the per-punch latency.
    var newEvent = { id: newId, userId: userId, type: type, timestamp: newTs, date: newDate };
    var refreshed;
    if (type === "clock_in" && status === "finished") {
      // 退勤後の新シフト開始 → セッションはこの新イベントだけにリセット
      refreshed = [newEvent];
    } else {
      refreshed = todayLogs.concat([newEvent]);
    }

    return {
      success: true,
      status: deriveStatus(refreshed),
      todayLog: refreshed.map(stripRow),
    };
  } finally {
    lock.releaseLock();
  }
}

function getStatus(body) {
  var userId = (body.userId || "").toString();
  if (!userId) return { success: false, message: "Missing userId" };
  var todayLogs = getSessionLogs(userId);
  return {
    success: true,
    status: deriveStatus(todayLogs),
    todayLog: todayLogs.map(stripRow),
  };
}

function stripRow(r) {
  return {
    id: r.id,
    userId: r.userId,
    type: r.type,
    timestamp: normalizeTimestamp(r.timestamp),
    date: normalizeDate(r.date),
  };
}

// ----------------------------------------------------------------
// Attendance management (list / add / update / delete)
// 勤怠管理画面で使う CRUD API
// ----------------------------------------------------------------
var VALID_PUNCH_TYPES = ["clock_in", "clock_out", "break_start", "break_end"];

// Build a timestamp string in TIMEZONE for "yyyy-MM-dd" + "HH:mm[:ss]".
function _composeTs(date, time) {
  var t = String(time || "");
  // Normalize "HH:mm" to "HH:mm:00"
  if (/^\d{2}:\d{2}$/.test(t)) t = t + ":00";
  if (!/^\d{2}:\d{2}:\d{2}$/.test(t)) return "";
  // Format using the spreadsheet TZ to keep ISO consistent
  var d = new Date(date + "T" + t);
  if (isNaN(d.getTime())) return "";
  return Utilities.formatDate(d, TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX");
}

function listAttendance(body) {
  var userId = (body.userId || "").toString();
  var dateFrom = (body.dateFrom || "").toString();
  var dateTo = (body.dateTo || "").toString();

  var sheet = getSheet(ATT_SHEET);
  // Read recent rows for performance — covers most editing use cases.
  // If editing very old records is required, increase this number.
  var rows = getRecentRows(sheet, 3000);
  var filtered = rows.filter(function (r) {
    var d = normalizeDate(r.date);
    if (userId && String(r.userId) !== userId) return false;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });
  // Sort by timestamp descending (newest first)
  filtered.sort(function (a, b) {
    var ta = new Date(normalizeTimestamp(a.timestamp));
    var tb = new Date(normalizeTimestamp(b.timestamp));
    return tb - ta;
  });
  return {
    success: true,
    records: filtered.map(function (r) {
      return {
        id: String(r.id || ""),
        userId: String(r.userId || ""),
        name: String(r.name || ""),
        role: String(r.role || ""),
        type: String(r.type || ""),
        timestamp: normalizeTimestamp(r.timestamp),
        date: normalizeDate(r.date),
      };
    }),
  };
}

function addAttendance(body) {
  var userId = (body.userId || "").toString();
  var date = (body.date || "").toString();
  var time = (body.time || "").toString();
  var type = (body.type || "").toString();
  if (!userId || !date || !time || !type) return { success: false, message: "Missing fields" };
  if (VALID_PUNCH_TYPES.indexOf(type) === -1) return { success: false, message: "Invalid type" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  var ts = _composeTs(date, time);
  if (!ts) return { success: false, message: "Invalid time" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(ATT_SHEET);
    var user = findUserById(userId);
    var name = user ? String(user.name || "") : "";
    var role = user ? String(user.role || "") : "";
    var newId = uuid();
    appendTextRow(sheet, [newId, userId, type, ts, date, name, role]);
    return { success: true, id: newId };
  } finally {
    lock.releaseLock();
  }
}

function updateAttendance(body) {
  var id = (body.id || "").toString();
  var userId = (body.userId || "").toString();
  var date = (body.date || "").toString();
  var time = (body.time || "").toString();
  var type = (body.type || "").toString();
  if (!id || !userId || !date || !time || !type) return { success: false, message: "Missing fields" };
  if (VALID_PUNCH_TYPES.indexOf(type) === -1) return { success: false, message: "Invalid type" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  var ts = _composeTs(date, time);
  if (!ts) return { success: false, message: "Invalid time" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(ATT_SHEET);
    var rows = getAllRows(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].id) === id) {
        var user = findUserById(userId);
        var name = user ? String(user.name || "") : String(rows[i].name || "");
        var role = user ? String(user.role || "") : String(rows[i].role || "");
        writeTextRow(sheet, rows[i]._rowIndex, [id, userId, type, ts, date, name, role]);
        return { success: true };
      }
    }
    return { success: false, message: "Not found" };
  } finally {
    lock.releaseLock();
  }
}

function deleteAttendance(body) {
  return _deleteFromSheet(ATT_SHEET, (body.id || "").toString());
}

// ----------------------------------------------------------------
// Shifts: register / list / delete
// ----------------------------------------------------------------
function registerShift(body) {
  var userId = (body.userId || "").toString();
  var date = (body.date || "").toString();
  var startTime = (body.startTime || "").toString();
  var endTime = (body.endTime || "").toString();
  var note = (body.note || "").toString();

  if (!userId || !date || !startTime || !endTime) {
    return { success: false, message: "Missing fields" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false, message: "Invalid date" };
  }
  if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
    return { success: false, message: "Invalid time" };
  }

  var user = findUserById(userId);
  if (!user) return { success: false, message: "User not found" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(SHIFTS_SHEET);
    appendTextRow(sheet, [
      uuid(),
      userId,
      user.name,
      date,
      startTime,
      endTime,
      note,
      nowIso(),
    ]);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function listShifts(body) {
  // filterUserId is optional. If empty, returns all users' shifts.
  var filterUserId = (body.filterUserId || "").toString();
  var year = parseInt(body.year, 10);
  var month = parseInt(body.month, 10);
  var dateFrom = (body.dateFrom || "").toString(); // yyyy-MM-dd inclusive
  var dateTo = (body.dateTo || "").toString();     // yyyy-MM-dd inclusive

  var sheet = getSheet(SHIFTS_SHEET);
  var rows = getAllRows(sheet);

  var prefix = "";
  if (year && month) {
    var mm = month < 10 ? "0" + month : "" + month;
    prefix = year + "-" + mm;
  }

  var filtered = rows.filter(function (r) {
    var d = normalizeDate(r.date);
    if (prefix && d.indexOf(prefix) !== 0) return false;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    if (filterUserId && String(r.userId) !== filterUserId) return false;
    return true;
  });

  filtered.sort(function (a, b) {
    var da = normalizeDate(a.date);
    var db = normalizeDate(b.date);
    if (da !== db) return da < db ? -1 : 1;
    var sa = normalizeTime(a.startTime);
    var sb = normalizeTime(b.startTime);
    return sa < sb ? -1 : sa > sb ? 1 : 0;
  });

  return {
    success: true,
    shifts: filtered.map(function (r) {
      return {
        id: r.id,
        userId: r.userId,
        userName: r.userName,
        date: normalizeDate(r.date),
        startTime: normalizeTime(r.startTime),
        endTime: normalizeTime(r.endTime),
        note: r.note,
      };
    }),
  };
}

function deleteShift(body) {
  // Kiosk mode: any operator can delete any shift entry.
  var shiftId = (body.shiftId || "").toString();
  if (!shiftId) return { success: false, message: "Missing fields" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(SHIFTS_SHEET);
    var rows = getAllRows(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].id) === String(shiftId)) {
        sheet.deleteRow(rows[i]._rowIndex);
        return { success: true };
      }
    }
    return { success: false, message: "Shift not found" };
  } finally {
    lock.releaseLock();
  }
}

// ----------------------------------------------------------------
// Shift patterns: 3 fixed slots (P1, P2, P3)
// ----------------------------------------------------------------
function getPatterns(body) {
  var sheet = getSheet(PATTERNS_SHEET);
  var rows = getAllRows(sheet);
  var byId = {};
  rows.forEach(function (r) { byId[String(r.id)] = r; });

  var patterns = DEFAULT_PATTERNS.map(function (def) {
    var existing = byId[def[0]];
    return {
      id: def[0],
      name: existing ? existing.name : def[1],
      startTime: normalizeTime(existing ? existing.startTime : def[2]),
      endTime: normalizeTime(existing ? existing.endTime : def[3]),
      color: existing ? existing.color : def[4],
    };
  });
  return { success: true, patterns: patterns };
}

function savePatterns(body) {
  var input = body.patterns;
  if (!input || !input.length) {
    return { success: false, message: "Missing patterns" };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(PATTERNS_SHEET);
    var rows = getAllRows(sheet);
    var rowByPid = {};
    rows.forEach(function (r) { rowByPid[String(r.id)] = r; });

    // Build a lookup of submitted patterns keyed by id for safe matching.
    var byId = {};
    input.forEach(function (p) { if (p && p.id) byId[String(p.id)] = p; });

    DEFAULT_PATTERNS.forEach(function (def, i) {
      var pid = def[0];
      var p = byId[pid];
      if (!p) return;
      var name = (p.name || "").toString().trim() || def[1];
      var startTime = (p.startTime || "").toString().trim() || def[2];
      var endTime = (p.endTime || "").toString().trim() || def[3];
      var color = (p.color || "").toString().trim() || def[4];

      var rowData = [pid, name, startTime, endTime, color];
      var existing = rowByPid[pid];
      if (existing) {
        writeTextRow(sheet, existing._rowIndex, rowData);
      } else {
        appendTextRow(sheet, rowData);
      }
    });
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

// ----------------------------------------------------------------
// Transactions: Purchases (仕入れ) and PettyCash (小口現金)
// ----------------------------------------------------------------
function _toNum(v) {
  if (v === null || v === undefined || v === "") return 0;
  var n = parseFloat(String(v).replace(/[^\d.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function listPurchases(body) {
  var store = (body.store || "").toString();
  var dateFrom = (body.dateFrom || "").toString();
  var dateTo = (body.dateTo || "").toString();

  var sheet = getSheet(PURCHASES_SHEET);
  var rows = getAllRows(sheet);

  var filtered = rows.filter(function (r) {
    var d = normalizeDate(r.date);
    if (store && String(r.store) !== store) return false;
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    return true;
  });

  filtered.sort(function (a, b) {
    var da = normalizeDate(a.date);
    var db = normalizeDate(b.date);
    return da < db ? 1 : da > db ? -1 : 0; // newest first
  });

  return {
    success: true,
    purchases: filtered.map(function (r) {
      return {
        id: r.id,
        store: r.store,
        date: normalizeDate(r.date),
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
      };
    }),
  };
}

// 支払状況を "paid" / "unpaid" / "" のいずれかに正規化する。
function _normPaymentStatus(v) {
  var s = String(v || "").trim();
  return PAYMENT_STATUSES.indexOf(s) >= 0 ? s : "";
}

function registerPurchase(body) {
  var date = (body.date || "").toString();
  var store = (body.store || "").toString().trim();
  var vendor = (body.vendor || "").toString().trim();
  var productName = (body.productName || "").toString().trim();
  if (!date || !store || !productName) {
    return { success: false, message: "Missing required fields" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false, message: "Invalid date" };
  }

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(PURCHASES_SHEET);
    var data = {
      id: uuid(),
      store: store,
      date: date,
      vendor: vendor,
      productName: productName,
      specification: (body.specification || "").toString(),
      category: (body.category || "").toString(),
      unitPrice: _toNum(body.unitPrice),
      quantity: _toNum(body.quantity),
      taxRate: _toNum(body.taxRate),
      paymentMethod: (body.paymentMethod || "").toString(),
      paymentStatus: _normPaymentStatus(body.paymentStatus),
      method: (body.method || "manual").toString(),
      note: (body.note || "").toString(),
      createdAt: nowIso(),
    };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
    appendTextRow(sheet, row);
    _ensureInMaster(STORES_SHEET, store);
    if (vendor) _ensureInMaster(VENDORS_SHEET, vendor);
    // Auto-track item in inventory master so it shows up in stocktake suggestions.
    _upsertInventoryItem(
      store,
      (body.category || "").toString(),
      productName,
      "",
      _toNum(body.unitPrice) * (1 + _toNum(body.taxRate) / 100),
      vendor
    );
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

// 仕入の一括登録
// body = { date, store, vendor, paymentMethod, items: [{productName, category,
//          unitPrice, quantity, taxRate, note}] }
// 共通項目(date/store/vendor/paymentMethod)は全アイテムに適用される。
// 1リクエスト内で 1 ロック獲得 → 全件 append → ロック解放。
function registerPurchaseBatch(body) {
  var date = (body.date || "").toString();
  var store = (body.store || "").toString().trim();
  var vendor = (body.vendor || "").toString().trim();
  var paymentMethod = (body.paymentMethod || "").toString();
  var paymentStatus = _normPaymentStatus(body.paymentStatus);
  var items = body.items;
  if (!date || !store) return { success: false, message: "Missing required fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  if (!Array.isArray(items) || items.length === 0) return { success: false, message: "No items" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(PURCHASES_SHEET);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var inserted = 0;
    items.forEach(function (item) {
      var productName = (item.productName || "").toString().trim();
      if (!productName) return; // 商品名が空の行はスキップ
      var unitPrice = _toNum(item.unitPrice);
      var quantity = _toNum(item.quantity);
      var taxRate = _toNum(item.taxRate);
      var category = (item.category || "").toString();
      var data = {
        id: uuid(),
        store: store,
        date: date,
        vendor: vendor,
        productName: productName,
        specification: (item.specification || "").toString(),
        category: category,
        unitPrice: unitPrice,
        quantity: quantity,
        taxRate: taxRate,
        paymentMethod: paymentMethod,
        paymentStatus: paymentStatus,
        method: "manual",
        note: (item.note || "").toString(),
        createdAt: nowIso(),
      };
      var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
      appendTextRow(sheet, row);
      // 在庫マスタへ自動反映(food/drink のみ)
      _upsertInventoryItem(
        store, category, productName, "",
        unitPrice * (1 + taxRate / 100),
        vendor
      );
      inserted += 1;
    });
    _ensureInMaster(STORES_SHEET, store);
    if (vendor) _ensureInMaster(VENDORS_SHEET, vendor);
    return { success: true, inserted: inserted };
  } finally {
    lock.releaseLock();
  }
}

function deletePurchase(body) {
  var id = (body.id || "").toString();
  if (!id) return { success: false, message: "Missing id" };
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(PURCHASES_SHEET);
    var rows = getAllRows(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].id) === id) {
        sheet.deleteRow(rows[i]._rowIndex);
        return { success: true };
      }
    }
    return { success: false, message: "Not found" };
  } finally {
    lock.releaseLock();
  }
}

function listPettyCash(body) {
  var store = (body.store || "").toString();
  var year = parseInt(body.year, 10);
  var month = parseInt(body.month, 10);
  // dateFrom/dateTo を指定すると年月より優先して期間で絞り込む (CSV出力用)。
  var dateFrom = (body.dateFrom || "").toString();
  var dateTo = (body.dateTo || "").toString();
  var useRange = !!(dateFrom || dateTo);

  var sheet = getSheet(PETTY_SHEET);
  var rows = getAllRows(sheet);

  var prefix = "";
  if (!useRange && year && month) {
    var mm = month < 10 ? "0" + month : "" + month;
    prefix = year + "-" + mm;
  }

  var filtered = rows.filter(function (r) {
    var d = normalizeDate(r.date);
    if (store && String(r.store) !== store) return false;
    if (useRange) {
      if (dateFrom && d < dateFrom) return false;
      if (dateTo && d > dateTo) return false;
    } else if (prefix && d.indexOf(prefix) !== 0) {
      return false;
    }
    return true;
  });

  filtered.sort(function (a, b) {
    var da = normalizeDate(a.date);
    var db = normalizeDate(b.date);
    return da < db ? -1 : da > db ? 1 : 0;
  });

  // Compute running balance
  var balance = 0;
  var items = filtered.map(function (r) {
    var amount = _toNum(r.amount);
    var type = String(r.type || "out");
    if (type === "in") balance += amount;
    else balance -= amount;
    return {
      id: r.id,
      store: r.store,
      date: normalizeDate(r.date),
      type: type,
      category: r.category,
      subCategory: r.subCategory,
      productName: r.productName || "",
      amount: amount,
      // 数量対応前に登録された行は unitPrice/quantity が空。金額をそのまま
      // 単価とみなし数量1として返すことで、画面もCSVも一貫して扱える。
      unitPrice: _toNum(r.unitPrice) || amount,
      quantity: _toNum(r.quantity) || 1,
      taxRate: _toNum(r.taxRate),
      paymentMethod: r.paymentMethod || "",
      vendor: r.vendor,
      taxCode: r.taxCode,
      note: r.note,
      balance: balance,
    };
  });

  return { success: true, items: items, balance: balance };
}

// 小口の金額は「単価(税込) × 数量」。単価/数量が未指定のリクエスト(旧クライアント)
// では amount をそのまま使い、単価=amount / 数量=1 として保存する。
function _resolvePettyAmount(src) {
  var unitPrice = _toNum(src.unitPrice);
  var quantity = _toNum(src.quantity);
  if (unitPrice > 0 && quantity > 0) {
    return { unitPrice: unitPrice, quantity: quantity, amount: unitPrice * quantity };
  }
  var amount = _toNum(src.amount);
  return { unitPrice: amount, quantity: 1, amount: amount };
}

function registerPettyCash(body) {
  var date = (body.date || "").toString();
  var store = (body.store || "").toString().trim();
  var type = (body.type || "out").toString();
  var category = (body.category || "").toString().trim();
  var resolved = _resolvePettyAmount(body);
  var amount = resolved.amount;

  if (!date || !store || !category) {
    return { success: false, message: "Missing required fields" };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { success: false, message: "Invalid date" };
  }
  if (type !== "in" && type !== "out") type = "out";

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(PETTY_SHEET);
    var vendorName = (body.vendor || "").toString();
    var data = {
      id: uuid(),
      store: store,
      date: date,
      type: type,
      category: category,
      subCategory: (body.subCategory || "").toString(),
      productName: (body.productName || "").toString(),
      amount: amount,
      unitPrice: resolved.unitPrice,
      quantity: resolved.quantity,
      taxRate: _toNum(body.taxRate),
      paymentMethod: (body.paymentMethod || "").toString(),
      vendor: vendorName,
      taxCode: (body.taxCode || "").toString(),
      note: (body.note || "").toString(),
      createdAt: nowIso(),
    };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
    appendTextRow(sheet, row);
    _ensureInMaster(STORES_SHEET, store);
    if (vendorName.trim()) _ensureInMaster(VENDORS_SHEET, vendorName.trim());
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

// 小口現金の一括登録
// body = { date, store, type:"in|out", vendor, taxCode, items: [{category,
//          subCategory, productName, amount, taxRate, note}] }
function registerPettyCashBatch(body) {
  var date = (body.date || "").toString();
  var store = (body.store || "").toString().trim();
  var type = (body.type || "out").toString();
  var vendor = (body.vendor || "").toString().trim();
  var taxCode = (body.taxCode || "").toString();
  var items = body.items;
  if (!date || !store) return { success: false, message: "Missing required fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };
  if (!Array.isArray(items) || items.length === 0) return { success: false, message: "No items" };
  if (type !== "in" && type !== "out") type = "out";

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(PETTY_SHEET);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var inserted = 0;
    items.forEach(function (item) {
      var category = (item.category || "").toString().trim();
      var resolved = _resolvePettyAmount(item);
      var amount = resolved.amount;
      if (!category || amount <= 0) return; // 必須欠損行はスキップ
      var data = {
        id: uuid(),
        store: store,
        date: date,
        type: type,
        category: category,
        subCategory: (item.subCategory || "").toString(),
        productName: (item.productName || "").toString(),
        amount: amount,
        unitPrice: resolved.unitPrice,
        quantity: resolved.quantity,
        taxRate: _toNum(item.taxRate),
        paymentMethod: "",
        vendor: vendor,
        taxCode: taxCode,
        note: (item.note || "").toString(),
        createdAt: nowIso(),
      };
      var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
      appendTextRow(sheet, row);
      inserted += 1;
    });
    _ensureInMaster(STORES_SHEET, store);
    if (vendor) _ensureInMaster(VENDORS_SHEET, vendor);
    return { success: true, inserted: inserted };
  } finally {
    lock.releaseLock();
  }
}

function deletePettyCash(body) {
  var id = (body.id || "").toString();
  if (!id) return { success: false, message: "Missing id" };
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(PETTY_SHEET);
    var rows = getAllRows(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].id) === id) {
        sheet.deleteRow(rows[i]._rowIndex);
        return { success: true };
      }
    }
    return { success: false, message: "Not found" };
  } finally {
    lock.releaseLock();
  }
}

// Returns store names from the master sheet (sorted alphabetically).
// Used by transaction screen to populate dropdowns/datalists.
function listStores(body) {
  var rows = getAllRows(getSheet(STORES_SHEET));
  var names = rows.map(function (r) { return String(r.name || "").trim(); })
                  .filter(function (n) { return n; });
  names.sort();
  return { success: true, stores: names };
}

function listVendors(body) {
  var rows = getAllRows(getSheet(VENDORS_SHEET));
  var names = rows.map(function (r) { return String(r.name || "").trim(); })
                  .filter(function (n) { return n; });
  names.sort();
  return { success: true, vendors: names };
}

// 商品名の入力候補。過去に登録された商品名を仕入れ・小口の両方から集め、
// 大文字小文字を無視して重複を除いたうえで「直近に登録された順」に返す。
// datalist はこの配列順にサジェストを表示するので、よく使う商品が上に来る。
function listProductNames(body) {
  var seen = {};   // lowercase name -> { name, date }
  var items = [];

  function collect(sheetName) {
    getAllRows(getSheet(sheetName)).forEach(function (r) {
      var name = String(r.productName || "").trim();
      if (!name) return;
      var date = normalizeDate(r.date);
      var key = name.toLowerCase();
      if (seen[key]) {
        // 同じ商品名が複数回登録されている場合は最新の日付を採用する
        if (date > seen[key].date) seen[key].date = date;
        return;
      }
      seen[key] = { name: name, date: date };
      items.push(seen[key]);
    });
  }
  collect(PURCHASES_SHEET);
  collect(PETTY_SHEET);

  items.sort(function (a, b) {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1; // newest first
    return a.name.localeCompare(b.name);
  });

  return {
    success: true,
    products: items.map(function (p) { return p.name; }),
  };
}

// ----------------------------------------------------------------
// Master CRUD: Stores
// ----------------------------------------------------------------
function listStoreMaster(body) {
  var rows = getAllRows(getSheet(STORES_SHEET));
  rows.sort(function (a, b) {
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return {
    success: true,
    stores: rows.map(function (r) {
      return {
        id: r.id,
        name: r.name,
        address: r.address,
        phone: r.phone,
        note: r.note,
      };
    }),
  };
}

function registerStore(body) {
  var name = (body.name || "").toString().trim();
  if (!name) return { success: false, message: "Name required" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(STORES_SHEET);
    var rows = getAllRows(sheet);
    var lower = name.toLowerCase();
    if (rows.some(function (r) { return String(r.name || "").trim().toLowerCase() === lower; })) {
      return { success: false, code: "DUPLICATE", message: "Store already exists" };
    }
    sheet.appendRow([
      uuid(),
      name,
      (body.address || "").toString(),
      (body.phone || "").toString(),
      (body.note || "").toString(),
      nowIso(),
    ]);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function deleteStore(body) {
  return _deleteFromSheet(STORES_SHEET, (body.id || "").toString());
}

// ----------------------------------------------------------------
// Master CRUD: Vendors
// ----------------------------------------------------------------
function listVendorMaster(body) {
  var rows = getAllRows(getSheet(VENDORS_SHEET));
  rows.sort(function (a, b) {
    return String(a.name || "").localeCompare(String(b.name || ""));
  });
  return {
    success: true,
    vendors: rows.map(function (r) {
      return {
        id: r.id,
        name: r.name,
        taxCode: r.taxCode,
        address: r.address,
        phone: r.phone,
        note: r.note,
      };
    }),
  };
}

function registerVendor(body) {
  var name = (body.name || "").toString().trim();
  if (!name) return { success: false, message: "Name required" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(VENDORS_SHEET);
    var rows = getAllRows(sheet);
    var lower = name.toLowerCase();
    if (rows.some(function (r) { return String(r.name || "").trim().toLowerCase() === lower; })) {
      return { success: false, code: "DUPLICATE", message: "Vendor already exists" };
    }
    sheet.appendRow([
      uuid(),
      name,
      (body.taxCode || "").toString(),
      (body.address || "").toString(),
      (body.phone || "").toString(),
      (body.note || "").toString(),
      nowIso(),
    ]);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function deleteVendor(body) {
  return _deleteFromSheet(VENDORS_SHEET, (body.id || "").toString());
}

function _deleteFromSheet(sheetName, id) {
  if (!id) return { success: false, message: "Missing id" };
  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(sheetName);
    var rows = getAllRows(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].id) === id) {
        sheet.deleteRow(rows[i]._rowIndex);
        return { success: true };
      }
    }
    return { success: false, message: "Not found" };
  } finally {
    lock.releaseLock();
  }
}

// ----------------------------------------------------------------
// Dashboard: Daily sales + Monthly targets + aggregated KPIs
// ----------------------------------------------------------------
function listDailySales(body) {
  var store = (body.store || "").toString();
  var year = parseInt(body.year, 10);
  var month = parseInt(body.month, 10);
  var dateFrom = (body.dateFrom || "").toString();
  var dateTo = (body.dateTo || "").toString();
  if (!store) return { success: false, message: "Missing fields" };
  // dateFrom/dateTo takes precedence; fallback to month-prefix matching for back-compat
  var prefix = (year && month) ? (year + "-" + (month < 10 ? "0" + month : "" + month)) : "";

  var rows = getAllRows(getSheet(DAILY_SALES_SHEET));
  var filtered = rows.filter(function (r) {
    if (String(r.store) !== store) return false;
    var d = normalizeDate(r.date);
    if (dateFrom && d < dateFrom) return false;
    if (dateTo && d > dateTo) return false;
    if (!dateFrom && !dateTo && prefix && d.indexOf(prefix) !== 0) return false;
    return true;
  });
  filtered.sort(function (a, b) {
    var da = normalizeDate(a.date), db = normalizeDate(b.date);
    return da < db ? 1 : da > db ? -1 : 0;
  });
  return {
    success: true,
    items: filtered.map(function (r) {
      return {
        id: r.id,
        store: r.store,
        date: normalizeDate(r.date),
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
      };
    }),
  };
}

// Upsert: if an entry for the same (store, date) exists, replace it.
function upsertDailySales(body) {
  var store = (body.store || "").toString().trim();
  var date = (body.date || "").toString();
  if (!store || !date) return { success: false, message: "Missing fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { success: false, message: "Invalid date" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(DAILY_SALES_SHEET);
    var rows = getAllRows(sheet);
    var existing = null;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].store) === store && normalizeDate(rows[i].date) === date) {
        existing = rows[i];
        break;
      }
    }

    var totalSalesIncl = _toNum(body.totalSalesIncl);
    var totalSalesExcl = _toNum(body.totalSalesExcl);
    var foodSalesIncl = _toNum(body.foodSalesIncl);
    var foodSalesExcl = _toNum(body.foodSalesExcl);
    var drinkSalesIncl = _toNum(body.drinkSalesIncl);
    var drinkSalesExcl = _toNum(body.drinkSalesExcl);
    // Back-compat: dashboard aggregates use foodSales/drinkSales/otherSales (tax-excl).
    // If only legacy fields are sent, fall back to them.
    var foodSales = foodSalesExcl || _toNum(body.foodSales);
    var drinkSales = drinkSalesExcl || _toNum(body.drinkSales);
    var otherFromTotal = totalSalesExcl - foodSales - drinkSales;
    var otherSales = otherFromTotal > 0 ? otherFromTotal : _toNum(body.otherSales);

    var data = {
      id: existing ? existing.id : uuid(),
      store: store,
      date: date,
      foodSales: foodSales,
      drinkSales: drinkSales,
      otherSales: otherSales,
      customers: _toNum(body.customers),
      note: (body.note || "").toString(),
      createdAt: existing ? existing.createdAt : nowIso(),
      totalSalesIncl: totalSalesIncl,
      totalSalesExcl: totalSalesExcl,
      foodSalesIncl: foodSalesIncl,
      foodSalesExcl: foodSalesExcl,
      drinkSalesIncl: drinkSalesIncl,
      drinkSalesExcl: drinkSalesExcl,
      paymentCash: _toNum(body.paymentCash),
      paymentQr: _toNum(body.paymentQr),
      paymentCard: _toNum(body.paymentCard),
      discountAmount: _toNum(body.discountAmount),
      depositAmount: _toNum(body.depositAmount),
      pettyCashAmount: _toNum(body.pettyCashAmount),
    };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
    if (existing) {
      writeTextRow(sheet, existing._rowIndex, row);
    } else {
      appendTextRow(sheet, row);
    }
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function deleteDailySales(body) {
  return _deleteFromSheet(DAILY_SALES_SHEET, (body.id || "").toString());
}

function getMonthlyTarget(body) {
  var store = (body.store || "").toString();
  var yearMonth = (body.yearMonth || "").toString();
  if (!store || !yearMonth) return { success: false, message: "Missing fields" };

  var rows = getAllRows(getSheet(MONTHLY_TARGETS_SHEET));
  var found = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].store) === store && String(rows[i].yearMonth) === yearMonth) {
      found = rows[i];
      break;
    }
  }
  if (!found) {
    return { success: true, target: null };
  }
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

function upsertMonthlyTarget(body) {
  var store = (body.store || "").toString().trim();
  var yearMonth = (body.yearMonth || "").toString();
  if (!store || !yearMonth) return { success: false, message: "Missing fields" };
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return { success: false, message: "Invalid yearMonth" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(MONTHLY_TARGETS_SHEET);
    var rows = getAllRows(sheet);
    var existing = null;
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].store) === store && String(rows[i].yearMonth) === yearMonth) {
        existing = rows[i];
        break;
      }
    }

    // Preserve existing monthlyLaborCost if the caller didn't include it —
    // the dashboard now edits this field via a dedicated endpoint, so the
    // monthly-target modal must not wipe it.
    var hasLaborInBody = Object.prototype.hasOwnProperty.call(body, "monthlyLaborCost") &&
                         body.monthlyLaborCost !== "" && body.monthlyLaborCost !== null &&
                         body.monthlyLaborCost !== undefined;
    var preservedLaborCost = hasLaborInBody
      ? _toNum(body.monthlyLaborCost)
      : (existing ? _toNum(existing.monthlyLaborCost) : 0);

    var data = {
      id: existing ? existing.id : uuid(),
      store: store,
      yearMonth: yearMonth,
      foodSalesTarget: _toNum(body.foodSalesTarget),
      drinkSalesTarget: _toNum(body.drinkSalesTarget),
      otherSalesTarget: _toNum(body.otherSalesTarget),
      foodCostRatioTarget: _toNum(body.foodCostRatioTarget),
      drinkCostRatioTarget: _toNum(body.drinkCostRatioTarget),
      laborCostRatioTarget: _toNum(body.laborCostRatioTarget),
      monthlyLaborCost: preservedLaborCost,
      note: (body.note || "").toString(),
      createdAt: existing ? existing.createdAt : nowIso(),
    };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
    if (existing) {
      writeTextRow(sheet, existing._rowIndex, row);
    } else {
      appendTextRow(sheet, row);
    }
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

// Update only the monthlyLaborCost cell for a (store, yearMonth). Creates a
// minimal row if no MonthlyTargets entry exists yet for that combination.
function updateMonthlyLaborCost(body) {
  var store = (body.store || "").toString().trim();
  var yearMonth = (body.yearMonth || "").toString();
  var amount = _toNum(body.monthlyLaborCost);
  if (!store || !yearMonth) return { success: false, message: "Missing fields" };
  if (!/^\d{4}-\d{2}$/.test(yearMonth)) return { success: false, message: "Invalid yearMonth" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(MONTHLY_TARGETS_SHEET);
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var laborColIdx = headers.indexOf("monthlyLaborCost");
    if (laborColIdx < 0) return { success: false, message: "monthlyLaborCost column missing" };

    var rows = getAllRows(sheet);
    for (var i = 0; i < rows.length; i++) {
      if (String(rows[i].store) === store && String(rows[i].yearMonth) === yearMonth) {
        sheet.getRange(rows[i]._rowIndex, laborColIdx + 1).setValue(amount);
        return { success: true };
      }
    }
    // No row yet — append a minimal one
    var data = {
      id: uuid(),
      store: store,
      yearMonth: yearMonth,
      monthlyLaborCost: amount,
      createdAt: nowIso(),
    };
    var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
    appendTextRow(sheet, row);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

// Aggregate dashboard KPIs for a (store, dateFrom..dateTo).
// Reads DailySales, Purchases, PettyCash, Stocktakes, MonthlyTargets and
// returns derived metrics.
// Monthly target lookup uses the month containing `dateFrom` — that's the
// "context month" for monthly goal comparisons.
function getDashboard(body) {
  var store = (body.store || "").toString();
  var dateFrom = (body.dateFrom || "").toString();
  var dateTo = (body.dateTo || "").toString();
  if (!store) return { success: false, message: "Missing fields" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateFrom) || !/^\d{4}-\d{2}-\d{2}$/.test(dateTo)) {
    return { success: false, message: "Missing or invalid dateFrom/dateTo" };
  }
  if (dateFrom > dateTo) { var _tmp = dateFrom; dateFrom = dateTo; dateTo = _tmp; }
  // Derive context (year, month) from dateFrom for monthly target lookup
  var year = parseInt(dateFrom.slice(0, 4), 10);
  var month = parseInt(dateFrom.slice(5, 7), 10);
  var yearMonth = year + "-" + (month < 10 ? "0" + month : "" + month);
  function inRange(d) { return d >= dateFrom && d <= dateTo; }

  // Sales (from DailySales)
  var dailyRows = getAllRows(getSheet(DAILY_SALES_SHEET));
  var monthlyDaily = dailyRows.filter(function (r) {
    return String(r.store) === store && inRange(normalizeDate(r.date));
  });
  var foodSales = 0, drinkSales = 0, otherSales = 0, customers = 0;
  var foodSalesIncl = 0, foodSalesExcl = 0;
  var drinkSalesIncl = 0, drinkSalesExcl = 0;
  var totalSalesIncl = 0, totalSalesExcl = 0;
  var paymentCash = 0, paymentQr = 0, paymentCard = 0;
  var discountAmount = 0, depositAmount = 0, pettyCashAmount = 0;
  monthlyDaily.forEach(function (r) {
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
  var totalSales = foodSales + drinkSales + otherSales;
  var paymentTotal = paymentCash + paymentQr + paymentCard;

  // Purchases (cost) for the same store within the selected date range
  var purchaseRows = getAllRows(getSheet(PURCHASES_SHEET));
  var monthlyPurchases = purchaseRows.filter(function (r) {
    return String(r.store) === store && inRange(normalizeDate(r.date));
  });
  var foodPurchases = 0, drinkPurchases = 0, otherCost = 0;
  monthlyPurchases.forEach(function (r) {
    var amt = _toNum(r.unitPrice) * _toNum(r.quantity) * (1 + _toNum(r.taxRate) / 100);
    var cat = String(r.category || "");
    if (cat === "food") foodPurchases += amt;
    else if (cat === "drink") drinkPurchases += amt;
    else otherCost += amt;
  });

  // 小口現金で仕入れた分 (科目 purchaseFood / purchaseDrink) も仕入れ高に含める。
  // 小口の amount は税込入力なので、上の Purchases 側の税込換算額とそのまま合算できる。
  // type="in" は返品・返金とみなして控除する。
  // 仕入れ高に足し込むため、下の棚卸ベースの使用高計算もそのまま適用される。
  // その他の科目 (光熱費・通信費・予備金入金など) は原価ではないので対象外。
  var pettyFoodPurchases = 0, pettyDrinkPurchases = 0;
  getAllRows(getSheet(PETTY_SHEET)).forEach(function (r) {
    if (String(r.store) !== store) return;
    if (!inRange(normalizeDate(r.date))) return;
    var cat = String(r.category || "");
    if (cat !== "purchaseFood" && cat !== "purchaseDrink") return;
    var amt = _toNum(r.amount);
    if (String(r.type || "out") === "in") amt = -amt;
    if (cat === "purchaseFood") pettyFoodPurchases += amt;
    else pettyDrinkPurchases += amt;
  });
  foodPurchases += pettyFoodPurchases;
  drinkPurchases += pettyDrinkPurchases;

  // Stocktake-based cost: 当月使用高 = 前月棚卸高 + 当月仕入れ - 当月棚卸高
  // (only applied when stocktake data exists for that category — otherwise we
  // fall back to the simple "purchases-only" cost so this still works before
  // the user starts using the stocktake feature.)
  var prevYM = (function () {
    var py = year, pm = month - 1;
    if (pm < 1) { pm = 12; py -= 1; }
    return py + "-" + (pm < 10 ? "0" + pm : "" + pm);
  })();
  var stRows = getAllRows(getSheet(STOCKTAKES_SHEET));
  var prevStock = { food: 0, drink: 0 };
  var currStock = { food: 0, drink: 0 };
  var hasPrevStock = { food: false, drink: false };
  var hasCurrStock = { food: false, drink: false };
  stRows.forEach(function (r) {
    if (String(r.store) !== store) return;
    var cat = String(r.category || "");
    if (cat !== "food" && cat !== "drink") return;
    var ym = String(r.yearMonth || "");
    var amt = _toNum(r.amount);
    if (ym === yearMonth) {
      currStock[cat] += amt;
      hasCurrStock[cat] = true;
    } else if (ym === prevYM) {
      prevStock[cat] += amt;
      hasPrevStock[cat] = true;
    }
  });

  var foodCost = (hasPrevStock.food || hasCurrStock.food)
    ? (prevStock.food + foodPurchases - currStock.food)
    : foodPurchases;
  var drinkCost = (hasPrevStock.drink || hasCurrStock.drink)
    ? (prevStock.drink + drinkPurchases - currStock.drink)
    : drinkPurchases;
  var totalCost = foodCost + drinkCost + otherCost;

  // Monthly targets / manual labor cost
  var targetRows = getAllRows(getSheet(MONTHLY_TARGETS_SHEET));
  var target = null;
  for (var i = 0; i < targetRows.length; i++) {
    if (String(targetRows[i].store) === store && String(targetRows[i].yearMonth) === yearMonth) {
      target = targetRows[i];
      break;
    }
  }
  var foodSalesTarget = target ? _toNum(target.foodSalesTarget) : 0;
  var drinkSalesTarget = target ? _toNum(target.drinkSalesTarget) : 0;
  var otherSalesTarget = target ? _toNum(target.otherSalesTarget) : 0;
  var salesTarget = foodSalesTarget + drinkSalesTarget + otherSalesTarget;
  var foodCostRatioTarget = target ? _toNum(target.foodCostRatioTarget) : 0;
  var drinkCostRatioTarget = target ? _toNum(target.drinkCostRatioTarget) : 0;
  var laborCostRatioTarget = target ? _toNum(target.laborCostRatioTarget) : 0;
  var otherLaborCost = target ? _toNum(target.monthlyLaborCost) : 0;

  // Pace calc — number of days in [dateFrom, dateTo] (totalRangeDays) and
  // how many of them have already passed (elapsedRangeDays). Must compute
  // these BEFORE the labor pro-rating below (which depends on totalRangeDays).
  var nowStr = Utilities.formatDate(new Date(), getSpreadsheetTz(), "yyyy-MM-dd");
  var daysInMonth = new Date(year, month, 0).getDate();
  var elapsedRangeDays = 0;
  var totalRangeDays = 0;
  (function () {
    var fromD = new Date(dateFrom + "T00:00:00");
    var toD = new Date(dateTo + "T00:00:00");
    var cur = new Date(fromD.getTime());
    while (cur.getTime() <= toD.getTime()) {
      totalRangeDays += 1;
      var s = Utilities.formatDate(cur, getSpreadsheetTz(), "yyyy-MM-dd");
      if (s <= nowStr) elapsedRangeDays += 1;
      cur.setDate(cur.getDate() + 1);
    }
  })();

  // Attendance-derived labor cost — calculated only for shifts whose clock_in
  // falls within the selected date range so it stays consistent with sales.
  var attLabor = calcAttendanceLaborCost(store, year, month, dateFrom, dateTo);
  // Manual "other" labor cost is set monthly — pro-rate to the range share.
  var daysInMonthForLabor = new Date(year, month, 0).getDate();
  var laborPart = (totalRangeDays > 0 && daysInMonthForLabor > 0)
    ? Math.min(totalRangeDays, daysInMonthForLabor) / daysInMonthForLabor
    : 0;
  var otherLaborCostPart = otherLaborCost * laborPart;
  var totalLaborCost = otherLaborCostPart + attLabor.cost;
  // Backward-compat field: todayDay used by the frontend's progress label
  var todayDay = elapsedRangeDays;
  var expectedToToday = salesTarget * (daysInMonth > 0 ? elapsedRangeDays / daysInMonth : 0);

  var profit = totalSales - totalCost - totalLaborCost;

  return {
    success: true,
    yearMonth: yearMonth,
    daysInMonth: daysInMonth,
    todayDay: todayDay,
    dateFrom: dateFrom,
    dateTo: dateTo,
    totalRangeDays: totalRangeDays,
    elapsedRangeDays: elapsedRangeDays,
    sales: {
      total: totalSales,
      food: foodSales,
      drink: drinkSales,
      other: otherSales,
      customers: customers,
      avgPerCustomer: customers > 0 ? totalSales / customers : 0,
      // New per-field aggregates from the updated daily-sales form
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

// Sum attendance-based labor cost for a given store + month.
// Pairs each clock_in with the next clock_out for the same user (across day
// boundaries — supports night shifts like 22:00 -> 06:00 next morning), then
// subtracts any break intervals. The paid duration is attributed to the
// month of the clock_in. An unpaired clock_in (=退勤忘れ) is silently
// dropped — that user's hours for that day are NOT counted.
function calcAttendanceLaborCost(store, year, month, dateFrom, dateTo) {
  var targetYM = year + "-" + (month < 10 ? "0" + month : "" + month);
  var tz = getSpreadsheetTz();
  // If a date range was passed in, restrict pair attribution to it.
  // Otherwise fall back to "any shift whose clock_in is in this month".
  var hasRange = /^\d{4}-\d{2}-\d{2}$/.test(String(dateFrom || "")) &&
                 /^\d{4}-\d{2}-\d{2}$/.test(String(dateTo || ""));

  // Build a map of store-belonging users with their role + rates.
  // - role=employee with dailyRate>0 → 日給制(出勤日数 × dailyRate)
  // - その他 (主に parttime) → 時給制(労働時間 × hourlyRate)
  var userRows = getAllRows(getSheet(USERS_SHEET));
  var userMap = {};
  userRows.forEach(function (u) {
    if (String(u.store || "").trim() === store) {
      userMap[String(u.id)] = {
        name: u.name,
        role: String(u.role || ""),
        hourlyRate: _toNum(u.hourlyRate),
        dailyRate: _toNum(u.dailyRate),
      };
    }
  });

  // Collect ALL attendance events for those users (no per-month pre-filter —
  // a night shift's clock_in and clock_out might fall on different months).
  var attRows = getAllRows(getSheet(ATT_SHEET));
  var byUser = {};
  attRows.forEach(function (r) {
    var uid = String(r.userId);
    if (!userMap[uid]) return;
    var ts = new Date(normalizeTimestamp(r.timestamp));
    if (isNaN(ts.getTime())) return;
    if (!byUser[uid]) byUser[uid] = [];
    byUser[uid].push({ type: String(r.type), ts: ts });
  });

  var totalCost = 0;
  var totalMinutes = 0;
  Object.keys(byUser).forEach(function (uid) {
    var u = userMap[uid];
    var events = byUser[uid].sort(function (a, b) { return a.ts - b.ts; });

    // 日給制: dailyRate > 0 なら役職に関係なく日給ベースで計算する。
    //         (admin で月給制の従業員も含めて扱えるようにシンプル化)
    //         出勤日数(clock_in が発生した日)を数えて dailyRate を掛ける。
    //         労働時間は参考値として 8h/日 で計上。
    var isDaily = u.dailyRate > 0;
    if (isDaily) {
      var workDays = {};
      for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.type !== "clock_in") continue;
        var dateStr = Utilities.formatDate(e.ts, tz, "yyyy-MM-dd");
        var inYM = dateStr.substring(0, 7);
        var attribute = hasRange
          ? (dateStr >= dateFrom && dateStr <= dateTo)
          : (inYM === targetYM);
        if (attribute) workDays[dateStr] = true;
      }
      var dayCount = Object.keys(workDays).length;
      totalCost += dayCount * u.dailyRate;
      totalMinutes += dayCount * 8 * 60; // 8h/日 換算で参考値
      return;
    }

    // 時給制: 既存ロジック(clock_in と clock_out をペアリングし、休憩を控除)
    var rate = u.hourlyRate;
    var clockIn = null;
    var breakStart = null;
    var breakTotal = 0;
    for (var j = 0; j < events.length; j++) {
      var ev = events[j];
      if (ev.type === "clock_in") {
        clockIn = ev.ts;
        breakStart = null;
        breakTotal = 0;
      } else if (ev.type === "break_start" && clockIn) {
        breakStart = ev.ts;
      } else if (ev.type === "break_end" && breakStart) {
        breakTotal += (ev.ts - breakStart);
        breakStart = null;
      } else if (ev.type === "clock_out" && clockIn) {
        var inDate2 = Utilities.formatDate(clockIn, tz, "yyyy-MM-dd");
        var inYM2 = inDate2.substring(0, 7);
        var attribute2 = hasRange
          ? (inDate2 >= dateFrom && inDate2 <= dateTo)
          : (inYM2 === targetYM);
        if (attribute2) {
          var minutes = ((ev.ts - clockIn) - breakTotal) / 60000;
          if (minutes < 0) minutes = 0;
          totalMinutes += minutes;
          totalCost += (minutes / 60) * rate;
        }
        clockIn = null;
        breakStart = null;
        breakTotal = 0;
      }
    }
  });

  return {
    cost: Math.round(totalCost),
    hours: totalMinutes / 60,
  };
}

// Auto-add a name to master if it's not already registered. Called from
// registerPurchase / registerPettyCash so anything typed in the transaction
// form is captured for future autocomplete.
function _ensureInMaster(sheetName, name) {
  if (!name) return;
  var sheet = getSheet(sheetName);
  var rows = getAllRows(sheet);
  var lower = String(name).trim().toLowerCase();
  if (rows.some(function (r) { return String(r.name || "").trim().toLowerCase() === lower; })) return;
  if (sheetName === STORES_SHEET) {
    sheet.appendRow([uuid(), name, "", "", "", nowIso()]);
  } else if (sheetName === VENDORS_SHEET) {
    sheet.appendRow([uuid(), name, "", "", "", "", nowIso()]);
  }
}

// ----------------------------------------------------------------
// Locations master (per store)
// ----------------------------------------------------------------
function listLocations(body) {
  var store = (body.store || "").toString();
  if (!store) return { success: false, message: "Missing store" };
  var rows = getAllRows(getSheet(LOCATIONS_SHEET));
  var filtered = rows.filter(function (r) { return String(r.store) === store; });
  filtered.sort(function (a, b) {
    var oa = _toNum(a.sortOrder), ob = _toNum(b.sortOrder);
    if (oa !== ob) return oa - ob;
    return String(a.name).localeCompare(String(b.name));
  });
  return {
    success: true,
    locations: filtered.map(function (r) {
      return { id: r.id, store: r.store, name: r.name, sortOrder: _toNum(r.sortOrder) };
    }),
  };
}

function registerLocation(body) {
  var store = (body.store || "").toString().trim();
  var name = (body.name || "").toString().trim();
  if (!store || !name) return { success: false, message: "Missing fields" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(LOCATIONS_SHEET);
    var rows = getAllRows(sheet);
    var lower = name.toLowerCase();
    if (rows.some(function (r) {
      return String(r.store) === store && String(r.name || "").trim().toLowerCase() === lower;
    })) {
      return { success: false, code: "DUPLICATE", message: "Location already exists" };
    }
    var nextOrder = (rows.filter(function (r) { return String(r.store) === store; }).length + 1) * 10;
    sheet.appendRow([uuid(), store, name, nextOrder, nowIso()]);
    return { success: true };
  } finally {
    lock.releaseLock();
  }
}

function deleteLocation(body) {
  return _deleteFromSheet(LOCATIONS_SHEET, (body.id || "").toString());
}

// ----------------------------------------------------------------
// Inventory items master (auto-populated from purchases)
// ----------------------------------------------------------------
function listInventoryItems(body) {
  var store = (body.store || "").toString();
  if (!store) return { success: false, message: "Missing store" };
  var rows = getAllRows(getSheet(INVENTORY_ITEMS_SHEET));
  var filtered = rows.filter(function (r) {
    return String(r.store) === store && !r.archived;
  });
  filtered.sort(function (a, b) {
    var ua = String(a.updatedAt || "");
    var ub = String(b.updatedAt || "");
    return ua < ub ? 1 : ua > ub ? -1 : 0; // newest updated first
  });
  return {
    success: true,
    items: filtered.map(function (r) {
      return {
        id: r.id,
        category: r.category,
        productName: r.productName,
        unit: r.unit,
        lastUnitPrice: _toNum(r.lastUnitPrice),
        lastVendor: r.lastVendor,
        lastPurchaseDate: r.lastPurchaseDate || "",
        updatedAt: r.updatedAt,
      };
    }),
  };
}

function registerInventoryItem(body) {
  var store = (body.store || "").toString().trim();
  var productName = (body.productName || "").toString().trim();
  if (!store || !productName) return { success: false, message: "Missing fields" };

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(INVENTORY_ITEMS_SHEET);
    var rows = getAllRows(sheet);
    var lower = productName.toLowerCase();
    if (rows.some(function (r) {
      return String(r.store) === store && String(r.productName || "").trim().toLowerCase() === lower;
    })) {
      return { success: false, code: "DUPLICATE", message: "Item already exists" };
    }
    var data = {
      id: uuid(),
      store: store,
      category: (body.category || "other").toString(),
      productName: productName,
      unit: (body.unit || "").toString(),
      lastUnitPrice: _toNum(body.lastUnitPrice),
      lastVendor: (body.lastVendor || "").toString(),
      archived: "",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
    appendTextRow(sheet, row);
    return { success: true, id: data.id };
  } finally {
    lock.releaseLock();
  }
}

function deleteInventoryItem(body) {
  return _deleteFromSheet(INVENTORY_ITEMS_SHEET, (body.id || "").toString());
}

// Internal: ensure an inventory item exists for (store, productName).
// Updates lastUnitPrice / lastVendor / category on existing rows.
// Called from registerPurchase. Only tracks food/drink categories.
function _upsertInventoryItem(store, category, productName, unit, unitPrice, vendor) {
  if (!store || !productName) return;
  if (category !== "food" && category !== "drink") return;

  var sheet = getSheet(INVENTORY_ITEMS_SHEET);
  var rows = getAllRows(sheet);
  var lower = String(productName).trim().toLowerCase();

  var existing = null;
  for (var i = 0; i < rows.length; i++) {
    if (String(rows[i].store) === store &&
        String(rows[i].productName || "").trim().toLowerCase() === lower) {
      existing = rows[i];
      break;
    }
  }

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var nowStr = nowIso();
  if (existing) {
    var lupCol = headers.indexOf("lastUnitPrice");
    var lvCol = headers.indexOf("lastVendor");
    var uaCol = headers.indexOf("updatedAt");
    var ctgCol = headers.indexOf("category");
    var lpdCol = headers.indexOf("lastPurchaseDate");
    if (lupCol >= 0 && unitPrice > 0) sheet.getRange(existing._rowIndex, lupCol + 1).setValue(unitPrice);
    if (lvCol >= 0 && vendor) sheet.getRange(existing._rowIndex, lvCol + 1).setValue(vendor);
    if (uaCol >= 0) sheet.getRange(existing._rowIndex, uaCol + 1).setValue(nowStr);
    if (ctgCol >= 0 && category) sheet.getRange(existing._rowIndex, ctgCol + 1).setValue(category);
    if (lpdCol >= 0) sheet.getRange(existing._rowIndex, lpdCol + 1).setValue(nowStr);
  } else {
    var data = {
      id: uuid(),
      store: store,
      category: category,
      productName: productName,
      unit: unit || "",
      lastUnitPrice: unitPrice,
      lastVendor: vendor || "",
      archived: "",
      createdAt: nowStr,
      updatedAt: nowStr,
      lastPurchaseDate: nowStr,
    };
    var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
    appendTextRow(sheet, row);
  }
}

// ----------------------------------------------------------------
// Stocktake (棚卸): per (store, location, yearMonth, item)
// ----------------------------------------------------------------
function listStocktakeSummary(body) {
  var store = (body.store || "").toString();
  var year = parseInt(body.year, 10);
  var month = parseInt(body.month, 10);
  if (!store || !year || !month) return { success: false, message: "Missing fields" };

  var yearMonth = year + "-" + (month < 10 ? "0" + month : "" + month);
  var prevYM = (function () {
    var py = year, pm = month - 1;
    if (pm < 1) { pm = 12; py -= 1; }
    return py + "-" + (pm < 10 ? "0" + pm : "" + pm);
  })();

  // Fetch locations for the store
  var locRows = getAllRows(getSheet(LOCATIONS_SHEET));
  var locations = locRows
    .filter(function (r) { return String(r.store) === store; })
    .sort(function (a, b) {
      var oa = _toNum(a.sortOrder), ob = _toNum(b.sortOrder);
      return oa - ob;
    });

  var stRows = getAllRows(getSheet(STOCKTAKES_SHEET));
  var current = {}; // location -> { itemCount, totalAmount, lastUpdated }
  var prevTotal = 0;
  var currentTotal = 0;
  var currentFoodTotal = 0;
  var currentDrinkTotal = 0;
  var prevFoodTotal = 0;
  var prevDrinkTotal = 0;
  stRows.forEach(function (r) {
    if (String(r.store) !== store) return;
    var ym = String(r.yearMonth || "");
    var amt = _toNum(r.amount);
    var cat = String(r.category || "");
    if (ym === yearMonth) {
      var loc = String(r.location);
      if (!current[loc]) current[loc] = { itemCount: 0, totalAmount: 0, lastUpdated: "" };
      current[loc].itemCount += 1;
      current[loc].totalAmount += amt;
      var u = String(r.updatedAt || r.createdAt || "");
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

  var summary = locations.map(function (loc) {
    var s = current[loc.name] || { itemCount: 0, totalAmount: 0, lastUpdated: "" };
    return {
      locationId: loc.id,
      name: loc.name,
      itemCount: s.itemCount,
      totalAmount: s.totalAmount,
      lastUpdated: s.lastUpdated,
    };
  });

  var completedCount = summary.filter(function (s) { return s.itemCount > 0; }).length;

  return {
    success: true,
    yearMonth: yearMonth,
    prevYearMonth: prevYM,
    locationCount: locations.length,
    completedCount: completedCount,
    currentTotal: currentTotal,
    currentFoodTotal: currentFoodTotal,
    currentDrinkTotal: currentDrinkTotal,
    prevTotal: prevTotal,
    prevFoodTotal: prevFoodTotal,
    prevDrinkTotal: prevDrinkTotal,
    summary: summary,
  };
}

function listStocktakeEntries(body) {
  var store = (body.store || "").toString();
  var location = (body.location || "").toString();
  var year = parseInt(body.year, 10);
  var month = parseInt(body.month, 10);
  if (!store || !location || !year || !month) return { success: false, message: "Missing fields" };

  var yearMonth = year + "-" + (month < 10 ? "0" + month : "" + month);
  var rows = getAllRows(getSheet(STOCKTAKES_SHEET));
  var filtered = rows.filter(function (r) {
    return String(r.store) === store &&
           String(r.location) === location &&
           String(r.yearMonth) === yearMonth;
  });
  filtered.sort(function (a, b) {
    var ca = String(a.createdAt || ""), cb = String(b.createdAt || "");
    return ca < cb ? -1 : ca > cb ? 1 : 0;
  });

  // Build inventory lookup: productName(lower) -> lastPurchaseDate
  var invRows = getAllRows(getSheet(INVENTORY_ITEMS_SHEET));
  var invMap = {};
  invRows.forEach(function (i) {
    if (String(i.store) !== store) return;
    var key = String(i.productName || "").trim().toLowerCase();
    invMap[key] = String(i.lastPurchaseDate || "");
  });

  return {
    success: true,
    entries: filtered.map(function (r) {
      var key = String(r.productName || "").trim().toLowerCase();
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

function upsertStocktakeEntry(body) {
  var store = (body.store || "").toString().trim();
  var location = (body.location || "").toString().trim();
  var year = parseInt(body.year, 10);
  var month = parseInt(body.month, 10);
  var productName = (body.productName || "").toString().trim();
  if (!store || !location || !year || !month || !productName) {
    return { success: false, message: "Missing fields" };
  }
  var yearMonth = year + "-" + (month < 10 ? "0" + month : "" + month);

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(STOCKTAKES_SHEET);
    var rows = getAllRows(sheet);
    var itemId = (body.itemId || "").toString();

    // Match by id first if provided, else by (store, location, yearMonth, productName)
    var existing = null;
    if (body.id) {
      for (var i = 0; i < rows.length; i++) {
        if (String(rows[i].id) === String(body.id)) { existing = rows[i]; break; }
      }
    }
    if (!existing) {
      var lower = productName.toLowerCase();
      for (var j = 0; j < rows.length; j++) {
        if (String(rows[j].store) === store &&
            String(rows[j].location) === location &&
            String(rows[j].yearMonth) === yearMonth &&
            String(rows[j].productName || "").trim().toLowerCase() === lower) {
          existing = rows[j];
          break;
        }
      }
    }

    var quantity = _toNum(body.quantity);
    var unitPrice = _toNum(body.unitPrice);
    var amount = quantity * unitPrice;

    var data = {
      id: existing ? existing.id : uuid(),
      store: store,
      location: location,
      yearMonth: yearMonth,
      itemId: itemId,
      category: (body.category || "").toString(),
      productName: productName,
      unit: (body.unit || "").toString(),
      vendor: (body.vendor || (existing ? existing.vendor : "") || "").toString(),
      unitPrice: unitPrice,
      quantity: quantity,
      amount: amount,
      note: (body.note || "").toString(),
      createdAt: existing ? existing.createdAt : nowIso(),
      updatedAt: nowIso(),
    };
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
    if (existing) {
      writeTextRow(sheet, existing._rowIndex, row);
    } else {
      appendTextRow(sheet, row);
    }
    return { success: true, id: data.id, amount: amount };
  } finally {
    lock.releaseLock();
  }
}

function deleteStocktakeEntry(body) {
  return _deleteFromSheet(STOCKTAKES_SHEET, (body.id || "").toString());
}

// Copy all entries from previous month into current month with quantity=0
// (only for entries not already present in the current month).
// ----------------------------------------------------------------
// Spreadsheet maintenance: format / cleanup sheets
//
// 使い方:
//   1. Apps Script エディタで関数 `formatAllSheets` を選んで実行 する
//      (or) スプレッドシートを開き直すと「⚙ システム」メニューが出るので
//           「全シートを整形」を選ぶ
//   2. 各シートに対して以下を適用:
//        - 不足列を自動追加 (既存データは保持)
//        - 全セルにテキスト書式 (@) を適用
//        - ヘッダー行: 太字 + 濃いグレー背景 + 白文字 + 行高 32px
//        - 1 行目をフリーズ
//        - 列幅を内容にあわせ自動調整 (90〜260px の範囲内)
// ----------------------------------------------------------------
var SHEET_SCHEMAS = {
  Users:          USER_COLUMNS,
  Attendance:     ["id", "userId", "type", "timestamp", "date"],
  Shifts:         ["id", "userId", "userName", "date", "startTime", "endTime", "note", "createdAt"],
  ShiftPatterns:  ["id", "name", "startTime", "endTime", "color"],
  Purchases:      PURCHASE_COLUMNS,
  PettyCash:      PETTY_COLUMNS,
  Stores:         ["id", "name", "address", "phone", "note", "createdAt"],
  Vendors:        ["id", "name", "taxCode", "address", "phone", "note", "createdAt"],
  DailySales:     ["id", "store", "date", "foodSales", "drinkSales", "otherSales", "customers", "note", "createdAt"],
  MonthlyTargets: ["id", "store", "yearMonth", "foodSalesTarget", "drinkSalesTarget", "otherSalesTarget",
                   "foodCostRatioTarget", "drinkCostRatioTarget", "laborCostRatioTarget",
                   "monthlyLaborCost", "note", "createdAt"],
  Locations:      ["id", "store", "name", "sortOrder", "createdAt"],
  InventoryItems: INVENTORY_ITEMS_COLUMNS,
  Stocktakes:     STOCKTAKE_COLUMNS,
};

// Adds a custom menu when the spreadsheet is opened.
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("⚙ システム")
      .addItem("📋 全シートを整形", "formatAllSheets")
      .addItem("🔧 全シートを作成 (未作成のみ)", "initAllSheets")
      .addSeparator()
      .addItem("👤 Users シートを整理", "organizeUsersSheet")
      .addItem("💴 日給を salary から自動補完", "backfillDailyRateFromSalary")
      .addItem("🌱 ROBATA NARU 11名を投入", "seedRobataNaruUsers")
      .addToUi();
  } catch (e) { /* not a UI context — running from web app */ }
}

// ==============================================================
// Users シート整理ユーティリティ
//
//   organizeUsersSheet()    : ゴミ行削除 + 列マイグレーション + 役職/氏名で並び替え
//   seedRobataNaruUsers()   : ROBATA NARU 給与明細の 11 名を未登録なら自動投入
//
//   両方とも何度実行しても安全(idempotent)です。
// ==============================================================

var ROBATA_DEFAULT_STORE = "ROBATA NARU";

// ROBATA NARU 2026/5 給与明細から抽出
// FULLTIME = role:"employee", dailyRate = 月給 ÷ 25日
// PARTTIME = role:"parttime", hourlyRate = 30,000 đ/h
var ROBATA_USER_SEED = [
  { name: "Nguyễn Tuấn Anh",  role: "employee", hourlyRate: 0,     dailyRate: 1020000 },
  { name: "Trần Văn Trường",  role: "employee", hourlyRate: 0,     dailyRate: 680000  },
  { name: "Nguyễn Đức Minh",  role: "employee", hourlyRate: 0,     dailyRate: 680000  },
  { name: "Lê Mạnh Duy",      role: "employee", hourlyRate: 0,     dailyRate: 408000  },
  { name: "Nguyễn Duy Anh",   role: "employee", hourlyRate: 0,     dailyRate: 680000  },
  { name: "Vũ Thanh Tùng",    role: "employee", hourlyRate: 0,     dailyRate: 1046000 },
  { name: "Nguyễn Phú Hải",   role: "parttime", hourlyRate: 30000, dailyRate: 0       },
  { name: "Trần Thành Tính",  role: "parttime", hourlyRate: 30000, dailyRate: 0       },
  { name: "Lưu Thị Ngọc Hân", role: "parttime", hourlyRate: 30000, dailyRate: 0       },
  { name: "Hà Kiều Ly",       role: "parttime", hourlyRate: 30000, dailyRate: 0       },
  { name: "Trần Thị Thùy",    role: "parttime", hourlyRate: 30000, dailyRate: 0       },
];

// Users シートの `salary`(月給)列を読んで、空の `dailyRate` を salary÷25 で
// 自動補完する。既に dailyRate に値があれば上書きしない。
// 標準勤務日数を変えたい場合は STANDARD_WORK_DAYS を変更。
var STANDARD_WORK_DAYS = 25;

function backfillDailyRateFromSalary() {
  var sheet = getSheet(USERS_SHEET);
  ensureUserColumns(sheet);
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow < 2) {
    try { SpreadsheetApp.getUi().alert("Users シートが空です"); } catch (e) {}
    return { success: true, updated: 0 };
  }

  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  // 月給は CSV では "salary" 列。スペース違い等のヘッダー揺れにも対応。
  var salaryColIdx = -1;
  for (var i = 0; i < headers.length; i++) {
    var h = String(headers[i] || "").toLowerCase().trim();
    if (h === "salary" || h === "monthlysalary" || h === "monthly salary") {
      salaryColIdx = i;
      break;
    }
  }
  var dailyRateColIdx = headers.indexOf("dailyRate");
  if (dailyRateColIdx < 0) {
    try { SpreadsheetApp.getUi().alert("dailyRate 列が見つかりません"); } catch (e) {}
    return { success: false, message: "dailyRate column missing" };
  }
  if (salaryColIdx < 0) {
    try { SpreadsheetApp.getUi().alert("salary 列が見つかりません(月給がここから取れません)"); } catch (e) {}
    return { success: false, message: "salary column missing" };
  }

  var range = sheet.getRange(2, 1, lastRow - 1, lastCol);
  var values = range.getValues();
  var updated = 0;
  var changes = [];
  for (var r = 0; r < values.length; r++) {
    var name = String(values[r][headers.indexOf("name")] || "").trim();
    if (!name) continue;
    var currentDaily = _toNum(values[r][dailyRateColIdx]);
    if (currentDaily > 0) continue; // 既に値があるならスキップ
    var salary = _toNum(values[r][salaryColIdx]);
    if (salary <= 0) continue; // 月給情報がない人はスキップ
    var newDaily = Math.round(salary / STANDARD_WORK_DAYS);
    values[r][dailyRateColIdx] = newDaily;
    changes.push("  ・" + name + ": 月給 " + salary.toLocaleString() + " → 日給 " + newDaily.toLocaleString());
    updated += 1;
  }
  if (updated > 0) {
    range.setValues(values);
  }
  // user キャッシュをクリア
  try {
    var cache = CacheService.getScriptCache();
    var rows = getAllRows(sheet);
    var keys = rows.map(function (r2) { return "user:" + String(r2.id || ""); });
    if (keys.length) cache.removeAll(keys);
  } catch (e) {}

  var msg = [
    "dailyRate 自動補完が完了しました(salary ÷ " + STANDARD_WORK_DAYS + ")。",
    "",
    "・更新: " + updated + " 名",
  ].concat(changes).join("\n");
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
  return { success: true, updated: updated };
}

// Users シートを整理(ゴミ行除去 + 列マイグレ + 並び替え)
function organizeUsersSheet() {
  var sheet = getSheet(USERS_SHEET);
  // 1. 列マイグレーション(USER_COLUMNS の不足列を末尾追加)
  ensureUserColumns(sheet);
  // 2. ゴミ行削除(id も name も空)
  var removed = _cleanupUsersPhantomRows(sheet);
  // 3. 役職→氏名 順に並び替え
  _sortUsersSheet(sheet);
  // 4. user キャッシュをクリア(古いデータが残らないように)
  try {
    var cache = CacheService.getScriptCache();
    var rows = getAllRows(sheet);
    var keys = rows.map(function (r) { return "user:" + String(r.id || ""); });
    if (keys.length) cache.removeAll(keys);
  } catch (e) {}

  var msg = [
    "Users シート整理が完了しました。",
    "",
    "・ゴミ行(ID/氏名 空)削除: " + removed + " 件",
    "・並び替え: 役職(admin → employee → parttime → その他)→ 氏名 順",
    "・列構成: 最新の " + USER_COLUMNS.length + " 列に同期",
  ].join("\n");
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
  return { success: true, removed: removed };
}

// ROBATA NARU 11 名を Users シートに投入(同名は既に居れば追加しない)
function seedRobataNaruUsers() {
  // 店舗マスタにも自動登録
  try { _ensureInMaster(STORES_SHEET, ROBATA_DEFAULT_STORE); } catch (e) {}

  var sheet = getSheet(USERS_SHEET);
  ensureUserColumns(sheet);
  var rows = getAllRows(sheet);

  // 既存ユーザーの名前を小文字化したセットで突合
  var existing = {};
  rows.forEach(function (r) {
    var n = String(r.name || "").trim().toLowerCase();
    if (n) existing[n] = true;
  });

  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var added = 0;
  var skipped = 0;
  var addedNames = [];
  ROBATA_USER_SEED.forEach(function (seed) {
    if (existing[seed.name.toLowerCase()]) { skipped += 1; return; }
    var data = {
      id: uuid(),
      name: seed.name,
      email: "",
      passwordHash: "",
      createdAt: nowIso(),
      role: seed.role,
      phone: "",
      birthDate: "",
      gender: "",
      idNumber: "",
      address: "",
      hireDate: "",
      emergencyContact: "",
      bankName: "",
      bankBranch: "",
      bankAccount: "",
      hourlyRate: seed.hourlyRate,
      dailyRate: seed.dailyRate,
      store: ROBATA_DEFAULT_STORE,
    };
    var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
    appendTextRow(sheet, row);
    addedNames.push(seed.name);
    added += 1;
  });

  // 投入後は整理もまとめて実行
  _sortUsersSheet(sheet);

  var msg = [
    "ROBATA NARU ユーザー投入が完了しました。",
    "",
    "・新規追加: " + added + " 名",
    "・既存スキップ: " + skipped + " 名(同名のため)",
    added ? "" : null,
    added ? "追加された名前:" : null,
  ].concat(addedNames.map(function (n) { return "  ・" + n; }))
   .filter(function (l) { return l !== null; })
   .join("\n");
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { Logger.log(msg); }
  return { success: true, added: added, skipped: skipped };
}

// id も name も空のゴミ行を削除。下から削るので行番号がずれない。
function _cleanupUsersPhantomRows(sheet) {
  var rows = getAllRows(sheet);
  var indices = [];
  rows.forEach(function (r) {
    var id = String(r.id || "").trim();
    var name = String(r.name || "").trim();
    if (!id && !name) indices.push(r._rowIndex);
  });
  indices.sort(function (a, b) { return b - a; });
  indices.forEach(function (i) { sheet.deleteRow(i); });
  return indices.length;
}

// 役職(admin → employee → parttime → その他) → 氏名 で並び替え。
// ヘッダー行(1行目)はそのまま、データ行のみソート。
function _sortUsersSheet(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 3) return;
  var lastCol = sheet.getLastColumn();
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var roleCol = headers.indexOf("role");
  var nameCol = headers.indexOf("name");
  if (roleCol < 0 || nameCol < 0) return;

  var dataRange = sheet.getRange(2, 1, lastRow - 1, lastCol);
  var values = dataRange.getValues();
  var roleOrder = { "admin": 0, "employee": 1, "parttime": 2 };
  values.sort(function (a, b) {
    var ra = roleOrder.hasOwnProperty(String(a[roleCol])) ? roleOrder[String(a[roleCol])] : 99;
    var rb = roleOrder.hasOwnProperty(String(b[roleCol])) ? roleOrder[String(b[roleCol])] : 99;
    if (ra !== rb) return ra - rb;
    var na = String(a[nameCol]).toLowerCase();
    var nb = String(b[nameCol]).toLowerCase();
    return na < nb ? -1 : na > nb ? 1 : 0;
  });
  dataRange.setValues(values);
}

// Manually creates any missing sheets without touching existing data.
function initAllSheets() {
  var created = 0;
  Object.keys(SHEET_SCHEMAS).forEach(function (name) {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var existed = ss.getSheetByName(name);
    getSheet(name);
    if (!existed) created += 1;
  });
  try {
    SpreadsheetApp.getUi().alert("シート作成完了: " + created + " シートを新規作成しました。");
  } catch (e) {}
  return { success: true, created: created };
}

// Formats every known sheet: auto-migrate columns, header style,
// text format, freeze, auto-resize.
function formatAllSheets() {
  var names = Object.keys(SHEET_SCHEMAS);
  names.forEach(function (name) {
    var sheet = getSheet(name); // ensures existence + column migrations where applicable
    var schema = SHEET_SCHEMAS[name];
    _ensureSchemaColumns(sheet, schema);
    _formatSheet(sheet, schema.length);
  });
  try {
    SpreadsheetApp.getUi().alert("シート整形が完了しました (" + names.length + " シート)");
  } catch (e) {}
  return { success: true, count: names.length };
}

// Ensures every column in `schema` exists on the sheet (appending any missing
// to the right). Existing data and column order are preserved.
function _ensureSchemaColumns(sheet, schema) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) {
    sheet.getRange(1, 1, 1, schema.length).setValues([schema]);
    return;
  }
  var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  for (var i = 0; i < schema.length; i++) {
    if (headers.indexOf(schema[i]) !== -1) continue;
    var newColIdx = sheet.getLastColumn() + 1;
    sheet.getRange(1, newColIdx).setValue(schema[i]);
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
}

function _formatSheet(sheet, schemaLen) {
  var lastCol = sheet.getLastColumn();
  if (lastCol < 1) return;

  // 1. Apply text format to all cells (prevents auto-conversion of
  //    "22:00" / "2026-05-01" / "06:00" into Date objects).
  sheet.getRange(1, 1, sheet.getMaxRows(), sheet.getMaxColumns()).setNumberFormat("@");

  // 2. Header row styling
  var headerRange = sheet.getRange(1, 1, 1, lastCol);
  headerRange.setFontWeight("bold");
  headerRange.setBackground("#1f2937"); // dark slate
  headerRange.setFontColor("#ffffff");
  headerRange.setHorizontalAlignment("left");
  headerRange.setVerticalAlignment("middle");
  headerRange.setFontSize(11);
  sheet.setRowHeight(1, 32);

  // 3. Freeze the header row
  sheet.setFrozenRows(1);

  // 4. Auto-resize columns with min / max clamps so things stay readable
  for (var i = 1; i <= lastCol; i++) {
    sheet.autoResizeColumn(i);
    var w = sheet.getColumnWidth(i);
    if (w < 90) sheet.setColumnWidth(i, 90);
    else if (w > 260) sheet.setColumnWidth(i, 260);
  }

  // 5. Soft border under header to separate it visually from data rows
  headerRange.setBorder(false, false, true, false, false, false,
    "#9ca3af", SpreadsheetApp.BorderStyle.SOLID);
}

function copyStocktakeFromPrevMonth(body) {
  var store = (body.store || "").toString();
  var location = (body.location || "").toString();
  var year = parseInt(body.year, 10);
  var month = parseInt(body.month, 10);
  if (!store || !location || !year || !month) return { success: false, message: "Missing fields" };

  var yearMonth = year + "-" + (month < 10 ? "0" + month : "" + month);
  var prevY = year, prevM = month - 1;
  if (prevM < 1) { prevM = 12; prevY -= 1; }
  var prevYM = prevY + "-" + (prevM < 10 ? "0" + prevM : "" + prevM);

  var lock = LockService.getScriptLock();
  lock.waitLock(5000);
  try {
    var sheet = getSheet(STOCKTAKES_SHEET);
    var rows = getAllRows(sheet);
    var prevEntries = rows.filter(function (r) {
      return String(r.store) === store &&
             String(r.location) === location &&
             String(r.yearMonth) === prevYM;
    });
    if (!prevEntries.length) return { success: true, copied: 0 };

    // Existing names in current month — skip duplicates
    var existing = {};
    rows.forEach(function (r) {
      if (String(r.store) === store &&
          String(r.location) === location &&
          String(r.yearMonth) === yearMonth) {
        existing[String(r.productName || "").trim().toLowerCase()] = true;
      }
    });

    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var copied = 0;
    prevEntries.forEach(function (e) {
      var key = String(e.productName || "").trim().toLowerCase();
      if (existing[key]) return;
      var data = {
        id: uuid(),
        store: store,
        location: location,
        yearMonth: yearMonth,
        itemId: e.itemId || "",
        category: e.category || "",
        productName: e.productName,
        unit: e.unit || "",
        vendor: e.vendor || "",
        unitPrice: _toNum(e.unitPrice),
        quantity: 0,
        amount: 0,
        note: "",
        createdAt: nowIso(),
        updatedAt: nowIso(),
      };
      var row = headers.map(function (h) { return data[h] !== undefined ? data[h] : ""; });
      appendTextRow(sheet, row);
      copied += 1;
    });
    return { success: true, copied: copied };
  } finally {
    lock.releaseLock();
  }
}
