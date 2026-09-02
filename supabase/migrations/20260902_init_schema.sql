-- ============================================================
-- ベトナム勤怠・店舗管理システム: Supabase 初期スキーマ
-- Googleスプレッドシートの各シートを 1:1 でテーブル化。
-- 日付/時刻はシート時代との互換のため text で保持する:
--   date      = "yyyy-MM-dd"
--   time      = "HH:mm"
--   timestamp = "yyyy-MM-dd'T'HH:mm:ss+07:00" (Asia/Ho_Chi_Minh)
-- 列名はフロント/API の JSON キーに合わせて camelCase (quoted)。
-- 全テーブル RLS 有効・ポリシー無し = anon キーからは一切読めない。
-- アクセスは Edge Function "api" (service role) 経由のみ。
-- ============================================================

-- 旧準備版の空テーブル (全列 text 型) を破棄して作り直す
drop table if exists users, attendance, shifts, shift_patterns, purchases,
  petty_cash, stores, vendors, daily_sales, monthly_targets, locations,
  inventory_items, stocktakes;

create table if not exists users (
  id text primary key,
  name text not null default '',
  email text not null default '',
  "passwordHash" text not null default '',
  "createdAt" text not null default '',
  role text not null default 'employee',
  phone text not null default '',
  "birthDate" text not null default '',
  gender text not null default '',
  "idNumber" text not null default '',
  address text not null default '',
  "hireDate" text not null default '',
  "emergencyContact" text not null default '',
  "bankName" text not null default '',
  "bankBranch" text not null default '',
  "bankAccount" text not null default '',
  "hourlyRate" numeric not null default 0,
  "dailyRate" numeric not null default 0,
  store text not null default '',
  -- 旧準備版スキーマにあった拡張列 (給与CSV取り込み用) を踏襲
  "salaryForm" text not null default '',
  salary numeric not null default 0,
  "transportationExpenses" numeric not null default 0,
  "parkingFee" numeric not null default 0,
  "distanceFromStoreKm" numeric not null default 0,
  "storeLocation" text not null default ''
);

create table if not exists attendance (
  id text primary key,
  "userId" text not null,
  type text not null,
  timestamp text not null,
  date text not null,
  name text not null default '',
  role text not null default '',
  store text not null default ''
);
create index if not exists attendance_user_ts_idx on attendance ("userId", timestamp);
create index if not exists attendance_date_idx on attendance (date);

create table if not exists shifts (
  id text primary key,
  "userId" text not null,
  "userName" text not null default '',
  date text not null,
  "startTime" text not null default '',
  "endTime" text not null default '',
  note text not null default '',
  "createdAt" text not null default '',
  store text not null default ''
);
create index if not exists shifts_date_idx on shifts (date);
create index if not exists shifts_user_idx on shifts ("userId");

create table if not exists shift_patterns (
  id text primary key,
  name text not null default '',
  "startTime" text not null default '',
  "endTime" text not null default '',
  color text not null default ''
);
insert into shift_patterns (id, name, "startTime", "endTime", color) values
  ('P1', 'Ca sáng / 早番', '08:00', '17:00', '#2563eb'),
  ('P2', 'Ca chiều / 遅番', '13:00', '22:00', '#d97706'),
  ('P3', 'Ca đêm / 夜勤', '22:00', '06:00', '#7c3aed')
on conflict (id) do nothing;

create table if not exists purchases (
  id text primary key,
  store text not null default '',
  date text not null,
  vendor text not null default '',
  "productName" text not null default '',
  specification text not null default '',
  category text not null default '',
  "unitPrice" numeric not null default 0,
  quantity numeric not null default 0,
  "taxRate" numeric not null default 0,
  "paymentMethod" text not null default '',
  method text not null default 'manual',
  note text not null default '',
  "createdAt" text not null default '',
  "paymentStatus" text not null default ''
);
create index if not exists purchases_store_date_idx on purchases (store, date);

create table if not exists petty_cash (
  id text primary key,
  store text not null default '',
  date text not null,
  type text not null default 'out',
  category text not null default '',
  "subCategory" text not null default '',
  "productName" text not null default '',
  amount numeric not null default 0,
  "taxRate" numeric not null default 0,
  "paymentMethod" text not null default '',
  vendor text not null default '',
  "taxCode" text not null default '',
  note text not null default '',
  "createdAt" text not null default '',
  "unitPrice" numeric not null default 0,
  quantity numeric not null default 0
);
create index if not exists petty_cash_store_date_idx on petty_cash (store, date);

create table if not exists stores (
  id text primary key,
  name text not null default '',
  address text not null default '',
  phone text not null default '',
  note text not null default '',
  "createdAt" text not null default ''
);

create table if not exists vendors (
  id text primary key,
  name text not null default '',
  "taxCode" text not null default '',
  address text not null default '',
  phone text not null default '',
  note text not null default '',
  "createdAt" text not null default ''
);

create table if not exists daily_sales (
  id text primary key,
  store text not null default '',
  date text not null,
  "foodSales" numeric not null default 0,
  "drinkSales" numeric not null default 0,
  "otherSales" numeric not null default 0,
  customers numeric not null default 0,
  note text not null default '',
  "createdAt" text not null default '',
  "totalSalesIncl" numeric not null default 0,
  "totalSalesExcl" numeric not null default 0,
  "foodSalesIncl" numeric not null default 0,
  "foodSalesExcl" numeric not null default 0,
  "drinkSalesIncl" numeric not null default 0,
  "drinkSalesExcl" numeric not null default 0,
  "paymentCash" numeric not null default 0,
  "paymentQr" numeric not null default 0,
  "paymentCard" numeric not null default 0,
  "discountAmount" numeric not null default 0,
  "depositAmount" numeric not null default 0,
  "pettyCashAmount" numeric not null default 0,
  unique (store, date)
);

create table if not exists monthly_targets (
  id text primary key,
  store text not null default '',
  "yearMonth" text not null,
  "foodSalesTarget" numeric not null default 0,
  "drinkSalesTarget" numeric not null default 0,
  "otherSalesTarget" numeric not null default 0,
  "foodCostRatioTarget" numeric not null default 0,
  "drinkCostRatioTarget" numeric not null default 0,
  "laborCostRatioTarget" numeric not null default 0,
  "monthlyLaborCost" numeric not null default 0,
  note text not null default '',
  "createdAt" text not null default '',
  unique (store, "yearMonth")
);

create table if not exists locations (
  id text primary key,
  store text not null default '',
  name text not null default '',
  "sortOrder" numeric not null default 0,
  "createdAt" text not null default ''
);
create index if not exists locations_store_idx on locations (store);

create table if not exists inventory_items (
  id text primary key,
  store text not null default '',
  category text not null default 'other',
  "productName" text not null default '',
  unit text not null default '',
  "lastUnitPrice" numeric not null default 0,
  "lastVendor" text not null default '',
  archived boolean not null default false,
  "createdAt" text not null default '',
  "updatedAt" text not null default '',
  "lastPurchaseDate" text not null default ''
);
create index if not exists inventory_items_store_idx on inventory_items (store);

create table if not exists stocktakes (
  id text primary key,
  store text not null default '',
  location text not null default '',
  "yearMonth" text not null,
  "itemId" text not null default '',
  category text not null default '',
  "productName" text not null default '',
  unit text not null default '',
  vendor text not null default '',
  "unitPrice" numeric not null default 0,
  quantity numeric not null default 0,
  amount numeric not null default 0,
  note text not null default '',
  "createdAt" text not null default '',
  "updatedAt" text not null default ''
);
create index if not exists stocktakes_store_ym_idx on stocktakes (store, "yearMonth");

-- RLS: 全テーブル有効化 (ポリシー無し = PostgREST 直アクセスは全拒否。
-- Edge Function は service role なので RLS をバイパスする)
alter table users enable row level security;
alter table attendance enable row level security;
alter table shifts enable row level security;
alter table shift_patterns enable row level security;
alter table purchases enable row level security;
alter table petty_cash enable row level security;
alter table stores enable row level security;
alter table vendors enable row level security;
alter table daily_sales enable row level security;
alter table monthly_targets enable row level security;
alter table locations enable row level security;
alter table inventory_items enable row level security;
alter table stocktakes enable row level security;
