-- ============================================================
-- HAZEON HMS — Audit Log
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action          TEXT NOT NULL,        -- 'create' | 'update' | 'delete' | 'payment' | 'correction' | 'generate'
  module          TEXT NOT NULL,        -- 'hostel' | 'library' | 'mess' | 'fees' | 'settings' | 'team'
  entity_name     TEXT,                 -- human-readable name e.g. "Rahul Sharma"
  entity_id       UUID,
  details         JSONB,                -- extra info e.g. { amount: 2000, mode: 'upi' }
  performed_by    UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_module     ON public.audit_log(module);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON public.audit_log(performed_by);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only owner and staff can read audit log
CREATE POLICY "audit_log_staff_read" ON public.audit_log
  FOR SELECT USING (public.current_user_role() IN ('owner', 'staff'));

-- Only server (service role) can insert — no direct client inserts
CREATE POLICY "audit_log_insert_service" ON public.audit_log
  FOR INSERT WITH CHECK (true);
