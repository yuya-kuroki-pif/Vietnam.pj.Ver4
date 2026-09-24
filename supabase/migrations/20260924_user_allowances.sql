-- 従業員マスタ: 給与・手当 (月額) の拡張 (2026-09-24)
-- 人件費集計 (勤怠集計・ダッシュボード) に自動計上される項目を従業員ごとに持つ。
-- 既存列 salary / transportationExpenses / parkingFee (旧CSV取込用) をそのまま活用し、
-- 社会保険 会社負担・その他手当・手当メモを追加する。
--
-- 按分ルール (Edge Function buildAttendanceBreakdown 参照):
--   月額 ÷ 当月の出勤日数 × 集計範囲内の出勤日数 を所属店舗に計上。出勤の無い月は計上しない。
alter table users add column if not exists "socialInsurance" numeric not null default 0;
alter table users add column if not exists "otherAllowance" numeric not null default 0;
alter table users add column if not exists "allowanceNote" text not null default '';

-- salaryForm を enum 相当 ('monthly' | 'daily' | 'hourly' | '') に正規化。
-- 旧値 "Monthly salary" / "Hourly wage" と誤入力 (店舗名など) を吸収する。
update users set "salaryForm" = case
  when lower("salaryForm") like 'month%' then 'monthly'
  when lower("salaryForm") like 'dai%'   then 'daily'
  when lower("salaryForm") like 'hour%'  then 'hourly'
  else ''
end;
-- 未設定の従業員は現在の単価から推定
update users set "salaryForm" = case
  when "dailyRate" > 0 then 'daily'
  when "hourlyRate" > 0 then 'hourly'
  else ''
end
where "salaryForm" = '';
