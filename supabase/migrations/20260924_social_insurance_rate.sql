-- 社会保険 会社負担を「月給 × 率」で算出する方式に変更 (2026-09-24)
-- 率は従業員ごとに持ち、既定は 28% (法定 21.5% に労組費等を上乗せした運用値)。
-- 手入力金額の列 users.socialInsurance は未使用になる (互換のため残す)。
alter table users add column if not exists "socialInsuranceRate" numeric not null default 28;
