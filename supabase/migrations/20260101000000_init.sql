-- ============================================================
-- HAZEON HMS — Complete Database Schema
-- Drops old schema first, then creates fresh UUID-based tables
-- ============================================================

-- Drop old tables (from original repo schema) in dependency order
DROP TABLE IF EXISTS public.sessions CASCADE;
DROP TABLE IF EXISTS public.monthly_fees CASCADE;
DROP TABLE IF EXISTS public.payment_log CASCADE;
DROP TABLE IF EXISTS public.broadcast_log CASCADE;
DROP TABLE IF EXISTS public.deleted_records CASCADE;
DROP TABLE IF EXISTS public.expenses CASCADE;
DROP TABLE IF EXISTS public.complaints CASCADE;
DROP TABLE IF EXISTS public.leaves CASCADE;
DROP TABLE IF EXISTS public.mess_attendance CASCADE;
DROP TABLE IF EXISTS public.mess_fees CASCADE;
DROP TABLE IF EXISTS public.library_fees CASCADE;
DROP TABLE IF EXISTS public.hostel_fees CASCADE;
DROP TABLE IF EXISTS public.mess_members CASCADE;
DROP TABLE IF EXISTS public.library_members CASCADE;
DROP TABLE IF EXISTS public.hostel_students CASCADE;
DROP TABLE IF EXISTS public.students CASCADE;
DROP TABLE IF EXISTS public.rooms CASCADE;
DROP TABLE IF EXISTS public.hostels CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.app_users CASCADE;
DROP TABLE IF EXISTS public.admins CASCADE;
DROP TABLE IF EXISTS public.interview_configs CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (extends Supabase Auth users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'staff', 'student')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  linked_student_id UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APP SETTINGS (single row)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inst_name                 TEXT NOT NULL DEFAULT 'My Institute',
  inst_address              TEXT,
  inst_phone                TEXT,
  admin_email               TEXT,
  wa_template               TEXT DEFAULT 'Dear {name}, your hostel fee of Rs.{amount} for {month} is due on {date}. Please pay at the earliest.',
  wa_template_fee_reminder  TEXT,
  reminder_days             INT NOT NULL DEFAULT 3,
  reminder_hour             INT NOT NULL DEFAULT 9,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings row
INSERT INTO public.app_settings (inst_name) VALUES ('Hazeon Institute');

-- ============================================================
-- HOSTELS (buildings)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hostels (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ROOMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.rooms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_id   UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  capacity    INT NOT NULL DEFAULT 1,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (hostel_id, room_number)
);

-- ============================================================
-- HOSTEL STUDENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hostel_students (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT,
  dob                 DATE,
  course              TEXT,
  hostel_id           UUID REFERENCES public.hostels(id),
  room_number         TEXT,
  joining_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  exit_date           DATE,
  monthly_fee_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_day             INT NOT NULL DEFAULT 5 CHECK (fee_day BETWEEN 1 AND 28),
  override_due_date   DATE,
  discount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exited')),
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from profiles to hostel_students
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_student
  FOREIGN KEY (linked_student_id) REFERENCES public.hostel_students(id) ON DELETE SET NULL;

-- ============================================================
-- LEAVES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leaves (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  UUID NOT NULL REFERENCES public.hostel_students(id) ON DELETE CASCADE,
  from_date   DATE NOT NULL,
  to_date     DATE,
  reason      TEXT,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  is_current  BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- LIBRARY MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.library_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT,
  dob                 DATE,
  seat_number         TEXT,
  joining_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  exit_date           DATE,
  monthly_fee_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_day             INT NOT NULL DEFAULT 5 CHECK (fee_day BETWEEN 1 AND 28),
  discount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exited')),
  linked_hostel_id    UUID REFERENCES public.hostel_students(id) ON DELETE SET NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESS MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mess_members (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT NOT NULL,
  phone               TEXT NOT NULL,
  email               TEXT,
  meal_plan           TEXT NOT NULL DEFAULT 'veg' CHECK (meal_plan IN ('veg', 'non_veg', 'custom')),
  custom_plan_name    TEXT,
  joining_date        DATE NOT NULL DEFAULT CURRENT_DATE,
  exit_date           DATE,
  monthly_fee_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  fee_day             INT NOT NULL DEFAULT 5 CHECK (fee_day BETWEEN 1 AND 28),
  discount            NUMERIC(10,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'exited')),
  linked_hostel_id    UUID REFERENCES public.hostel_students(id) ON DELETE SET NULL,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESS ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.mess_attendance (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES public.mess_members(id) ON DELETE CASCADE,
  att_date    DATE NOT NULL,
  present     BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, att_date)
);

-- ============================================================
-- FEE TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.hostel_fees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID NOT NULL REFERENCES public.hostel_students(id) ON DELETE CASCADE,
  month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INT NOT NULL,
  due_date        DATE NOT NULL,
  total_amount    NUMERIC(10,2) NOT NULL,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount      NUMERIC(10,2) NOT NULL,
  paid_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance         NUMERIC(10,2) GENERATED ALWAYS AS (net_amount - paid_amount) STORED,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, month, year)
);

CREATE TABLE IF NOT EXISTS public.library_fees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES public.library_members(id) ON DELETE CASCADE,
  month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INT NOT NULL,
  due_date        DATE NOT NULL,
  total_amount    NUMERIC(10,2) NOT NULL,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount      NUMERIC(10,2) NOT NULL,
  paid_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance         NUMERIC(10,2) GENERATED ALWAYS AS (net_amount - paid_amount) STORED,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, month, year)
);

CREATE TABLE IF NOT EXISTS public.mess_fees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES public.mess_members(id) ON DELETE CASCADE,
  month           INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INT NOT NULL,
  due_date        DATE NOT NULL,
  total_amount    NUMERIC(10,2) NOT NULL,
  discount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  net_amount      NUMERIC(10,2) NOT NULL,
  paid_amount     NUMERIC(10,2) NOT NULL DEFAULT 0,
  balance         NUMERIC(10,2) GENERATED ALWAYS AS (net_amount - paid_amount) STORED,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'paid', 'overdue')),
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (member_id, month, year)
);

-- ============================================================
-- PAYMENT LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module      TEXT NOT NULL CHECK (module IN ('hostel', 'library', 'mess')),
  fee_id      UUID NOT NULL,
  member_id   UUID NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  mode        TEXT NOT NULL DEFAULT 'cash' CHECK (mode IN ('cash', 'upi', 'cheque', 'bank_transfer', 'other')),
  notes       TEXT,
  paid_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by  UUID REFERENCES auth.users(id)
);

-- ============================================================
-- COMPLAINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.complaints (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      UUID REFERENCES public.hostel_students(id) ON DELETE SET NULL,
  raised_by       UUID REFERENCES auth.users(id),
  subject         TEXT NOT NULL,
  description     TEXT NOT NULL,
  priority        TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
  resolution_note TEXT,
  resolved_at     TIMESTAMPTZ,
  resolved_by     UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL,
  amount      NUMERIC(10,2) NOT NULL,
  category    TEXT NOT NULL DEFAULT 'misc' CHECK (category IN ('maintenance', 'utilities', 'staff', 'food', 'misc', 'other')),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes       TEXT,
  created_by  UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- DELETED RECORDS (soft delete audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.deleted_records (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name    TEXT NOT NULL,
  record_id     UUID NOT NULL,
  record_data   JSONB NOT NULL,
  deleted_by    UUID REFERENCES auth.users(id),
  deleted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- BROADCAST LOG
-- ============================================================
CREATE TABLE IF NOT EXISTS public.broadcast_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject     TEXT NOT NULL,
  message     TEXT NOT NULL,
  target      TEXT NOT NULL DEFAULT 'all' CHECK (target IN ('all', 'hostel', 'library', 'mess')),
  sent_by     UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_hostel_students_status     ON public.hostel_students(status);
CREATE INDEX IF NOT EXISTS idx_hostel_students_hostel_id  ON public.hostel_students(hostel_id);
CREATE INDEX IF NOT EXISTS idx_hostel_fees_student_month  ON public.hostel_fees(student_id, year, month);
CREATE INDEX IF NOT EXISTS idx_hostel_fees_status         ON public.hostel_fees(status);
CREATE INDEX IF NOT EXISTS idx_library_fees_member_month  ON public.library_fees(member_id, year, month);
CREATE INDEX IF NOT EXISTS idx_mess_fees_member_month     ON public.mess_fees(member_id, year, month);
CREATE INDEX IF NOT EXISTS idx_mess_attendance_member     ON public.mess_attendance(member_id, att_date);
CREATE INDEX IF NOT EXISTS idx_complaints_status          ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_student_id      ON public.complaints(student_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date              ON public.expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_payment_log_fee_id         ON public.payment_log(fee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_student_id          ON public.leaves(student_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_hostel_students
  BEFORE UPDATE ON public.hostel_students
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_hostel_fees
  BEFORE UPDATE ON public.hostel_fees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_library_members
  BEFORE UPDATE ON public.library_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_library_fees
  BEFORE UPDATE ON public.library_fees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_mess_members
  BEFORE UPDATE ON public.mess_members
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_mess_fees
  BEFORE UPDATE ON public.mess_fees
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_complaints
  BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER set_updated_at_expenses
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostels           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_students   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaves            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_attendance   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hostel_fees       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_fees      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_fees         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_log       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deleted_records   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_log     ENABLE ROW LEVEL SECURITY;

-- Helper functions
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID AS $$
  SELECT linked_student_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ---- PROFILES ----
DROP POLICY IF EXISTS "profiles_owner_all" ON public.profiles;
CREATE POLICY "profiles_owner_all" ON public.profiles
  FOR ALL USING (public.current_user_role() = 'owner');

DROP POLICY IF EXISTS "profiles_staff_read_own" ON public.profiles;
CREATE POLICY "profiles_staff_read_own" ON public.profiles
  FOR SELECT USING (
    public.current_user_role() = 'staff' AND id = auth.uid()
  );

DROP POLICY IF EXISTS "profiles_student_read_own" ON public.profiles;
CREATE POLICY "profiles_student_read_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- ---- APP SETTINGS ----
DROP POLICY IF EXISTS "settings_owner_all" ON public.app_settings;
CREATE POLICY "settings_owner_all" ON public.app_settings
  FOR ALL USING (public.current_user_role() = 'owner');

DROP POLICY IF EXISTS "settings_staff_read" ON public.app_settings;
CREATE POLICY "settings_staff_read" ON public.app_settings
  FOR SELECT USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- HOSTELS ----
DROP POLICY IF EXISTS "hostels_staff_read" ON public.hostels;
CREATE POLICY "hostels_staff_read" ON public.hostels
  FOR SELECT USING (public.current_user_role() IN ('owner', 'staff'));

DROP POLICY IF EXISTS "hostels_owner_write" ON public.hostels;
CREATE POLICY "hostels_owner_write" ON public.hostels
  FOR ALL USING (public.current_user_role() = 'owner');

-- ---- ROOMS ----
DROP POLICY IF EXISTS "rooms_staff_all" ON public.rooms;
CREATE POLICY "rooms_staff_all" ON public.rooms
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- HOSTEL STUDENTS ----
DROP POLICY IF EXISTS "students_staff_all" ON public.hostel_students;
CREATE POLICY "students_staff_all" ON public.hostel_students
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

DROP POLICY IF EXISTS "students_student_read_own" ON public.hostel_students;
CREATE POLICY "students_student_read_own" ON public.hostel_students
  FOR SELECT USING (id = public.current_student_id());

-- ---- LEAVES ----
DROP POLICY IF EXISTS "leaves_staff_all" ON public.leaves;
CREATE POLICY "leaves_staff_all" ON public.leaves
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

DROP POLICY IF EXISTS "leaves_student_read_own" ON public.leaves;
CREATE POLICY "leaves_student_read_own" ON public.leaves
  FOR SELECT USING (student_id = public.current_student_id());

-- ---- LIBRARY MEMBERS ----
DROP POLICY IF EXISTS "lib_members_staff_all" ON public.library_members;
CREATE POLICY "lib_members_staff_all" ON public.library_members
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

DROP POLICY IF EXISTS "lib_members_student_own" ON public.library_members;
CREATE POLICY "lib_members_student_own" ON public.library_members
  FOR SELECT USING (linked_hostel_id = public.current_student_id());

-- ---- MESS MEMBERS ----
DROP POLICY IF EXISTS "mess_members_staff_all" ON public.mess_members;
CREATE POLICY "mess_members_staff_all" ON public.mess_members
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

DROP POLICY IF EXISTS "mess_members_student_own" ON public.mess_members;
CREATE POLICY "mess_members_student_own" ON public.mess_members
  FOR SELECT USING (linked_hostel_id = public.current_student_id());

-- ---- MESS ATTENDANCE ----
DROP POLICY IF EXISTS "mess_att_staff_all" ON public.mess_attendance;
CREATE POLICY "mess_att_staff_all" ON public.mess_attendance
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- HOSTEL FEES ----
DROP POLICY IF EXISTS "hostel_fees_staff_all" ON public.hostel_fees;
CREATE POLICY "hostel_fees_staff_all" ON public.hostel_fees
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

DROP POLICY IF EXISTS "hostel_fees_student_own" ON public.hostel_fees;
CREATE POLICY "hostel_fees_student_own" ON public.hostel_fees
  FOR SELECT USING (student_id = public.current_student_id());

-- ---- LIBRARY FEES ----
DROP POLICY IF EXISTS "lib_fees_staff_all" ON public.library_fees;
CREATE POLICY "lib_fees_staff_all" ON public.library_fees
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

DROP POLICY IF EXISTS "lib_fees_student_own" ON public.library_fees;
CREATE POLICY "lib_fees_student_own" ON public.library_fees
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.library_members
      WHERE linked_hostel_id = public.current_student_id()
    )
  );

-- ---- MESS FEES ----
DROP POLICY IF EXISTS "mess_fees_staff_all" ON public.mess_fees;
CREATE POLICY "mess_fees_staff_all" ON public.mess_fees
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

DROP POLICY IF EXISTS "mess_fees_student_own" ON public.mess_fees;
CREATE POLICY "mess_fees_student_own" ON public.mess_fees
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.mess_members
      WHERE linked_hostel_id = public.current_student_id()
    )
  );

-- ---- PAYMENT LOG ----
DROP POLICY IF EXISTS "payment_log_staff_all" ON public.payment_log;
CREATE POLICY "payment_log_staff_all" ON public.payment_log
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- COMPLAINTS ----
DROP POLICY IF EXISTS "complaints_staff_all" ON public.complaints;
CREATE POLICY "complaints_staff_all" ON public.complaints
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

DROP POLICY IF EXISTS "complaints_student_own" ON public.complaints;
CREATE POLICY "complaints_student_own" ON public.complaints
  FOR ALL USING (
    raised_by = auth.uid() OR student_id = public.current_student_id()
  );

-- ---- EXPENSES ----
DROP POLICY IF EXISTS "expenses_staff_all" ON public.expenses;
CREATE POLICY "expenses_staff_all" ON public.expenses
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- DELETED RECORDS ----
DROP POLICY IF EXISTS "deleted_records_owner" ON public.deleted_records;
CREATE POLICY "deleted_records_owner" ON public.deleted_records
  FOR ALL USING (public.current_user_role() = 'owner');

-- ---- BROADCAST LOG ----
DROP POLICY IF EXISTS "broadcast_staff_all" ON public.broadcast_log;
CREATE POLICY "broadcast_staff_all" ON public.broadcast_log
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));
