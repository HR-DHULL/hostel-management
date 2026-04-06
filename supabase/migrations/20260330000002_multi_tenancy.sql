-- ============================================================
-- HAZEON HMS — Multi-tenancy Migration
-- Adds institute_id to all tables so one deployment can serve
-- multiple institutes. Existing data is migrated to a default
-- institute created from the current app_settings.inst_name.
-- ============================================================

-- 1. INSTITUTES table
CREATE TABLE IF NOT EXISTS public.institutes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL DEFAULT 'My Institute',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.institutes ENABLE ROW LEVEL SECURITY;

-- 2. Add institute_id column to all tables
ALTER TABLE public.profiles          ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.app_settings      ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.hostels           ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.rooms             ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.hostel_students   ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.library_members   ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.mess_members      ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.hostel_fees       ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.library_fees      ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.mess_fees         ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.payment_log       ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.complaints        ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.expenses          ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.leaves            ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.mess_attendance   ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;
ALTER TABLE public.audit_log         ADD COLUMN IF NOT EXISTS institute_id UUID REFERENCES public.institutes(id) ON DELETE CASCADE;

-- 3. Migrate existing data to a default institute
DO $$
DECLARE
  v_inst_id   UUID;
  v_inst_name TEXT;
BEGIN
  -- Read existing institute name from app_settings
  SELECT inst_name INTO v_inst_name FROM public.app_settings LIMIT 1;
  v_inst_name := COALESCE(v_inst_name, 'Hazeon Institute');

  -- Create the default institute
  INSERT INTO public.institutes (name) VALUES (v_inst_name) RETURNING id INTO v_inst_id;

  -- Migrate all tables
  UPDATE public.app_settings    SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.profiles        SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.hostels         SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.rooms           SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.hostel_students  SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.library_members  SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.mess_members    SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.hostel_fees     SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.library_fees    SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.mess_fees       SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.payment_log     SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.complaints      SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.expenses        SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.leaves          SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.mess_attendance SET institute_id = v_inst_id WHERE institute_id IS NULL;
  UPDATE public.audit_log       SET institute_id = v_inst_id WHERE institute_id IS NULL;
END $$;

-- 4. Helper function: get current user's institute_id
CREATE OR REPLACE FUNCTION public.current_user_institute_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT institute_id FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. Auto-set institute_id on INSERT via trigger
CREATE OR REPLACE FUNCTION public.auto_set_institute_id()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF NEW.institute_id IS NULL THEN
    NEW.institute_id := public.current_user_institute_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_hostels_institute        ON public.hostels;
DROP TRIGGER IF EXISTS trg_rooms_institute          ON public.rooms;
DROP TRIGGER IF EXISTS trg_students_institute       ON public.hostel_students;
DROP TRIGGER IF EXISTS trg_lib_members_institute    ON public.library_members;
DROP TRIGGER IF EXISTS trg_mess_members_institute   ON public.mess_members;
DROP TRIGGER IF EXISTS trg_hostel_fees_institute    ON public.hostel_fees;
DROP TRIGGER IF EXISTS trg_lib_fees_institute       ON public.library_fees;
DROP TRIGGER IF EXISTS trg_mess_fees_institute      ON public.mess_fees;
DROP TRIGGER IF EXISTS trg_payment_log_institute    ON public.payment_log;
DROP TRIGGER IF EXISTS trg_complaints_institute     ON public.complaints;
DROP TRIGGER IF EXISTS trg_expenses_institute       ON public.expenses;
DROP TRIGGER IF EXISTS trg_leaves_institute         ON public.leaves;
DROP TRIGGER IF EXISTS trg_mess_att_institute       ON public.mess_attendance;

CREATE TRIGGER trg_hostels_institute        BEFORE INSERT ON public.hostels        FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_rooms_institute          BEFORE INSERT ON public.rooms          FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_students_institute       BEFORE INSERT ON public.hostel_students FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_lib_members_institute    BEFORE INSERT ON public.library_members FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_mess_members_institute   BEFORE INSERT ON public.mess_members   FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_hostel_fees_institute    BEFORE INSERT ON public.hostel_fees    FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_lib_fees_institute       BEFORE INSERT ON public.library_fees   FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_mess_fees_institute      BEFORE INSERT ON public.mess_fees      FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_payment_log_institute    BEFORE INSERT ON public.payment_log    FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_complaints_institute     BEFORE INSERT ON public.complaints     FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_expenses_institute       BEFORE INSERT ON public.expenses       FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_leaves_institute         BEFORE INSERT ON public.leaves         FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();
CREATE TRIGGER trg_mess_att_institute       BEFORE INSERT ON public.mess_attendance FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();

-- 6. Update handle_new_user trigger to support new-institute registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_institute_id UUID;
  v_inst_name    TEXT;
BEGIN
  v_inst_name := COALESCE(NEW.raw_user_meta_data->>'inst_name', 'My Institute');

  IF COALESCE(NEW.raw_user_meta_data->>'role', '') = 'owner'
     AND (NEW.raw_user_meta_data->>'is_new_institute') = 'true' THEN
    -- New institute signup: create institute + settings
    INSERT INTO public.institutes (name) VALUES (v_inst_name) RETURNING id INTO v_institute_id;
    INSERT INTO public.app_settings (inst_name, institute_id) VALUES (v_inst_name, v_institute_id);
  ELSIF NEW.raw_user_meta_data->>'institute_id' IS NOT NULL THEN
    -- Staff / student invited to existing institute
    v_institute_id := (NEW.raw_user_meta_data->>'institute_id')::UUID;
  END IF;

  INSERT INTO public.profiles (id, display_name, role, institute_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff'),
    v_institute_id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Update RLS policies to scope by institute

-- INSTITUTES
DROP POLICY IF EXISTS "institutes_read" ON public.institutes;
CREATE POLICY "institutes_read" ON public.institutes
  FOR SELECT USING (id = public.current_user_institute_id());

DROP POLICY IF EXISTS "institutes_owner_update" ON public.institutes;
CREATE POLICY "institutes_owner_update" ON public.institutes
  FOR UPDATE USING (id = public.current_user_institute_id() AND public.current_user_role() = 'owner');

-- PROFILES (owner sees all in same institute; each user sees own)
DROP POLICY IF EXISTS "profiles_owner_all" ON public.profiles;
CREATE POLICY "profiles_owner_all" ON public.profiles
  FOR ALL USING (
    public.current_user_role() = 'owner' AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "profiles_staff_read_own" ON public.profiles;
CREATE POLICY "profiles_staff_read_own" ON public.profiles
  FOR SELECT USING (public.current_user_role() = 'staff' AND id = auth.uid());

DROP POLICY IF EXISTS "profiles_student_read_own" ON public.profiles;
CREATE POLICY "profiles_student_read_own" ON public.profiles
  FOR SELECT USING (id = auth.uid());

-- APP SETTINGS
DROP POLICY IF EXISTS "settings_owner_all" ON public.app_settings;
CREATE POLICY "settings_owner_all" ON public.app_settings
  FOR ALL USING (
    public.current_user_role() = 'owner' AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "settings_staff_read" ON public.app_settings;
CREATE POLICY "settings_staff_read" ON public.app_settings
  FOR SELECT USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

-- HOSTELS
DROP POLICY IF EXISTS "hostels_staff_read" ON public.hostels;
CREATE POLICY "hostels_staff_read" ON public.hostels
  FOR SELECT USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "hostels_owner_write" ON public.hostels;
CREATE POLICY "hostels_owner_write" ON public.hostels
  FOR ALL USING (
    public.current_user_role() = 'owner' AND
    institute_id = public.current_user_institute_id()
  );

-- ROOMS
DROP POLICY IF EXISTS "rooms_staff_all" ON public.rooms;
CREATE POLICY "rooms_staff_all" ON public.rooms
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

-- HOSTEL STUDENTS
DROP POLICY IF EXISTS "students_staff_all" ON public.hostel_students;
CREATE POLICY "students_staff_all" ON public.hostel_students
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "students_student_read_own" ON public.hostel_students;
CREATE POLICY "students_student_read_own" ON public.hostel_students
  FOR SELECT USING (id = public.current_student_id());

-- LEAVES
DROP POLICY IF EXISTS "leaves_staff_all" ON public.leaves;
CREATE POLICY "leaves_staff_all" ON public.leaves
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "leaves_student_read_own" ON public.leaves;
CREATE POLICY "leaves_student_read_own" ON public.leaves
  FOR SELECT USING (student_id = public.current_student_id());

-- LIBRARY MEMBERS
DROP POLICY IF EXISTS "lib_members_staff_all" ON public.library_members;
CREATE POLICY "lib_members_staff_all" ON public.library_members
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "lib_members_student_own" ON public.library_members;
CREATE POLICY "lib_members_student_own" ON public.library_members
  FOR SELECT USING (linked_hostel_id = public.current_student_id());

-- MESS MEMBERS
DROP POLICY IF EXISTS "mess_members_staff_all" ON public.mess_members;
CREATE POLICY "mess_members_staff_all" ON public.mess_members
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "mess_members_student_own" ON public.mess_members;
CREATE POLICY "mess_members_student_own" ON public.mess_members
  FOR SELECT USING (linked_hostel_id = public.current_student_id());

-- MESS ATTENDANCE
DROP POLICY IF EXISTS "mess_att_staff_all" ON public.mess_attendance;
CREATE POLICY "mess_att_staff_all" ON public.mess_attendance
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

-- HOSTEL FEES
DROP POLICY IF EXISTS "hostel_fees_staff_all" ON public.hostel_fees;
CREATE POLICY "hostel_fees_staff_all" ON public.hostel_fees
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "hostel_fees_student_own" ON public.hostel_fees;
CREATE POLICY "hostel_fees_student_own" ON public.hostel_fees
  FOR SELECT USING (student_id = public.current_student_id());

-- LIBRARY FEES
DROP POLICY IF EXISTS "lib_fees_staff_all" ON public.library_fees;
CREATE POLICY "lib_fees_staff_all" ON public.library_fees
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "lib_fees_student_own" ON public.library_fees;
CREATE POLICY "lib_fees_student_own" ON public.library_fees
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.library_members
      WHERE linked_hostel_id = public.current_student_id()
    )
  );

-- MESS FEES
DROP POLICY IF EXISTS "mess_fees_staff_all" ON public.mess_fees;
CREATE POLICY "mess_fees_staff_all" ON public.mess_fees
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "mess_fees_student_own" ON public.mess_fees;
CREATE POLICY "mess_fees_student_own" ON public.mess_fees
  FOR SELECT USING (
    member_id IN (
      SELECT id FROM public.mess_members
      WHERE linked_hostel_id = public.current_student_id()
    )
  );

-- PAYMENT LOG
DROP POLICY IF EXISTS "payment_log_staff_all" ON public.payment_log;
CREATE POLICY "payment_log_staff_all" ON public.payment_log
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

-- COMPLAINTS
DROP POLICY IF EXISTS "complaints_staff_all" ON public.complaints;
CREATE POLICY "complaints_staff_all" ON public.complaints
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "complaints_student_own" ON public.complaints;
CREATE POLICY "complaints_student_own" ON public.complaints
  FOR ALL USING (
    raised_by = auth.uid() OR student_id = public.current_student_id()
  );

-- EXPENSES
DROP POLICY IF EXISTS "expenses_staff_all" ON public.expenses;
CREATE POLICY "expenses_staff_all" ON public.expenses
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

-- AUDIT LOG
DROP POLICY IF EXISTS "audit_log_staff_read" ON public.audit_log;
CREATE POLICY "audit_log_staff_read" ON public.audit_log
  FOR SELECT USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "audit_log_insert_service" ON public.audit_log;
CREATE POLICY "audit_log_insert_service" ON public.audit_log
  FOR INSERT WITH CHECK (true);
