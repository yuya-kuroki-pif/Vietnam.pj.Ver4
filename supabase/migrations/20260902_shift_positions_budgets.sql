-- シフト表拡張: ポジションマスタ + 日別売上予算 + シフトへのポジション付与

create table if not exists positions (
  id text primary key,
  store text not null default '',
  name text not null default '',
  color text not null default '#64748b',
  "modelHours" numeric not null default 0,
  "sortOrder" numeric not null default 0,
  "createdAt" text not null default ''
);
create index if not exists positions_store_idx on positions (store);
alter table positions enable row level security;

create table if not exists shift_budgets (
  id text primary key,
  store text not null default '',
  date text not null,
  "salesBudget" numeric not null default 0,
  "createdAt" text not null default '',
  unique (store, date)
);
alter table shift_budgets enable row level security;

alter table shifts add column if not exists position text not null default '';

-- 初期ポジション (ROBATA NARU)。名前・色・モデル時間は画面から編集可能。
insert into positions (id, store, name, color, "modelHours", "sortOrder", "createdAt") values
  ('pos-hall',  'ROBATA NARU', 'Sảnh / ホール',        '#16a34a', 0, 10, '2026-09-02T23:30:00+07:00'),
  ('pos-kitchen','ROBATA NARU', 'Bếp / キッチン',       '#dc2626', 0, 20, '2026-09-02T23:30:00+07:00'),
  ('pos-drink', 'ROBATA NARU', 'Quầy đồ uống / ドリンク', '#f59e0b', 0, 30, '2026-09-02T23:30:00+07:00'),
  ('pos-prep',  'ROBATA NARU', 'Chuẩn bị / 仕込み',     '#6b7280', 0, 40, '2026-09-02T23:30:00+07:00')
on conflict (id) do nothing;
