-- ============================================================
-- HAZEON HMS — Complete Database Schema
-- Run this in Supabase SQL Editor to initialize the database
-- ============================================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- PROFILES (extends Supabase Auth users)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('owner', 'staff', 'student')),
  is_active     BOOLEAN NOT NULL DEFAULT true,
  linked_student_id UUID, -- FK added after hostel_students table is created
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APP SETTINGS (single row)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inst_name            TEXT NOT NULL DEFAULT 'My Institute',
  admin_email          TEXT,
  wa_template          TEXT DEFAULT 'Dear {name}, your hostel fee of ₹{amount} for {month} is due on {date}. Please pay at the earliest.',
  reminder_days        INT NOT NULL DEFAULT 3,
  reminder_hour        INT NOT NULL DEFAULT 9,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default settings row
INSERT INTO public.app_settings (inst_name) VALUES ('Hazeon Institute') ON CONFLICT DO NOTHING;

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
-- FEE TABLES (shared pattern: hostel / library / mess)
-- ============================================================

-- Hostel fees
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

-- Library fees
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

-- Mess fees
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
-- PAYMENT LOG (cross-module audit of all payments)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module      TEXT NOT NULL CHECK (module IN ('hostel', 'library', 'mess')),
  fee_id      UUID NOT NULL, -- polymorphic ref to hostel_fees/library_fees/mess_fees
  member_id   UUID NOT NULL, -- polymorphic ref to student/member
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
-- DELETED RECORDS (audit log for soft deletes)
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

CREATE OR REPLACE TRIGGER on_auth_user_created
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

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Helper function: get linked student id for current user
CREATE OR REPLACE FUNCTION public.current_student_id()
RETURNS UUID AS $$
  SELECT linked_student_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ---- PROFILES ----
CREATE POLICY "profiles_owner_all" ON public.profiles
  FOR ALL USING (public.current_user_role() = 'owner');

CREATE POLICY "profiles_staff_read_own" ON public.profiles
  FOR SELECT USING (
    public.current_user_role() = 'staff' AND id = auth.uid()
  );

CREATE POLICY "profiles_student_read_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- ---- APP SETTINGS ----
CREATE POLICY "settings_owner_all" ON public.app_settings
  FOR ALL USING (public.current_user_role() = 'owner');

CREATE POLICY "settings_staff_read" ON public.app_settings
  FOR SELECT USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- HOSTELS ----
CREATE POLICY "hostels_staff_read" ON public.hostels
  FOR SELECT USING (public.current_user_role() IN ('owner', 'staff'));

CREATE POLICY "hostels_owner_write" ON public.hostels
  FOR ALL USING (public.current_user_role() = 'owner');

-- ---- ROOMS ----
CREATE POLICY "rooms_staff_all" ON public.rooms
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- HOSTEL STUDENTS ----
CREATE POLICY "students_staff_all" ON public.hostel_students
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

CREATE POLICY "students_student_read_own" ON public.hostel_students
  FOR SELECT USING (id = public.current_student_id());

-- ---- LEAVES ----
CREATE POLICY "leaves_staff_all" ON public.leaves
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

CREATE POLICY "leaves_student_read_own" ON public.leaves
  FOR SELECT USING (student_id = public.current_student_id());

-- ---- LIBRARY MEMBERS ----
CREATE POLICY "lib_members_staff_all" ON public.library_members
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

CREATE POLICY "lib_members_student_own" ON public.library_members
  FOR SELECT USING (linked_hostel_id = public.current_student_id());

-- ---- MESS MEMBERS ----
CREATE POLICY "mess_members_staff_all" ON public.mess_members
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

CREATE POLICY "mess_members_student_own" ON public.mess_members
  FOR SELECT USING (linked_hostel_id = public.current_student_id());

-- ---- MESS ATTENDANCE ----
CREATE POLICY "mess_att_staff_all" ON public.mess_attendance
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- HOSTEL FEES ----
CREATE POLICY "hostel_fees_staff_all" ON public.hostel_fees
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

CREATE POLICY "hostel_fees_student_own" ON public.hostel_fees
  FOR SELECT USING (student_id = public.current_student_id());

-- ---- LIBRARY FEES ----
CREATE POLICY "lib_fees_staff_all" ON public.library_fees
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

CREATE POLICY "lib_fees_student_own" ON public.library_fees
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.library_members
      WHERE linked_hostel_id = public.current_student_id()
    )
  );

-- ---- MESS FEES ----
CREATE POLICY "mess_fees_staff_all" ON public.mess_fees
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

CREATE POLICY "mess_fees_student_own" ON public.mess_fees
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.mess_members
      WHERE linked_hostel_id = public.current_student_id()
    )
  );

-- ---- PAYMENT LOG ----
CREATE POLICY "payment_log_staff_all" ON public.payment_log
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- COMPLAINTS ----
CREATE POLICY "complaints_staff_all" ON public.complaints
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

CREATE POLICY "complaints_student_own" ON public.complaints
  FOR ALL USING (
    raised_by = auth.uid() OR student_id = public.current_student_id()
  );

-- ---- EXPENSES ----
CREATE POLICY "expenses_staff_all" ON public.expenses
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));

-- ---- DELETED RECORDS ----
CREATE POLICY "deleted_records_owner" ON public.deleted_records
  FOR ALL USING (public.current_user_role() = 'owner');

-- ---- BROADCAST LOG ----
CREATE POLICY "broadcast_staff_all" ON public.broadcast_log
  FOR ALL USING (public.current_user_role() IN ('owner', 'staff'));
