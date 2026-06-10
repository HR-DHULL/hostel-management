-- ============================================================
-- Allow fee_day up to 31 (was capped at 28).
-- The fee generator already clamps the due day to each month's
-- length (Math.min(fee_day, lastDayOfMonth)), so 29/30/31 are safe
-- to store. The old "BETWEEN 1 AND 28" check rejected member inserts
-- whenever a late-month fee day was entered.
-- ============================================================

alter table public.hostel_students drop constraint if exists hostel_students_fee_day_check;
alter table public.hostel_students add  constraint hostel_students_fee_day_check check (fee_day between 1 and 31);

alter table public.library_members drop constraint if exists library_members_fee_day_check;
alter table public.library_members add  constraint library_members_fee_day_check check (fee_day between 1 and 31);

alter table public.mess_members drop constraint if exists mess_members_fee_day_check;
alter table public.mess_members add  constraint mess_members_fee_day_check check (fee_day between 1 and 31);
