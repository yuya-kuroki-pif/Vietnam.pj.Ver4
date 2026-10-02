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
 *     → 以後 6時間ごと に自動同期されます (間隔は下の定数で変更可)
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
var SYNC_INTERVAL_HOURS = 6;

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

  TABLES.forEach(function (def) {
    var rows = fetchExport_(def.table);
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
