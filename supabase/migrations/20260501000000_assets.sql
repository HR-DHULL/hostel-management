-- ============================================================
-- HAZEON HMS - Asset Register Migration
-- Tracks durable items (laptops, phones, uniforms, furniture)
-- bought as expenses and issued to team members.
-- Supports reassignment + return history.
-- ============================================================

-- 1. Extend EXPENSES with asset-purchase flag and free-text recipient
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS is_asset_purchase BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS given_to          TEXT;

-- 2. ASSETS: the catalogue of durable physical items
CREATE TABLE IF NOT EXISTS public.assets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id    UUID REFERENCES public.institutes(id) ON DELETE CASCADE,
  expense_id      UUID REFERENCES public.expenses(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'other'
                  CHECK (category IN ('laptop', 'phone', 'uniform', 'furniture', 'equipment', 'other')),
  serial_number   TEXT,
  status          TEXT NOT NULL DEFAULT 'in_use'
                  CHECK (status IN ('in_use', 'in_storage', 'retired', 'lost')),
  purchase_amount NUMERIC(10,2),
  purchase_date   DATE,
  notes           TEXT,
  created_by      UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. ASSET_ASSIGNMENTS: who held the asset, when, and when it came back
CREATE TABLE IF NOT EXISTS public.asset_assignments (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institute_id           UUID REFERENCES public.institutes(id) ON DELETE CASCADE,
  asset_id               UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
  assigned_to_profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_to_name       TEXT,
  assigned_to_phone      TEXT,
  assigned_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  returned_at            TIMESTAMPTZ,
  assignment_notes       TEXT,
  created_by             UUID REFERENCES auth.users(id),
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Either an in-system profile OR a free-text name must be present
  CONSTRAINT chk_asset_assignment_recipient
    CHECK (assigned_to_profile_id IS NOT NULL OR assigned_to_name IS NOT NULL)
);

-- 4. INDEXES
CREATE INDEX IF NOT EXISTS idx_assets_institute      ON public.assets(institute_id);
CREATE INDEX IF NOT EXISTS idx_assets_expense        ON public.assets(expense_id);
CREATE INDEX IF NOT EXISTS idx_assets_status         ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_aa_asset              ON public.asset_assignments(asset_id);
CREATE INDEX IF NOT EXISTS idx_aa_profile            ON public.asset_assignments(assigned_to_profile_id);
CREATE INDEX IF NOT EXISTS idx_aa_institute          ON public.asset_assignments(institute_id);

-- Only one ACTIVE assignment per asset at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_aa_active_unique
  ON public.asset_assignments(asset_id)
  WHERE returned_at IS NULL;

-- 5. updated_at trigger for assets (assignments are append-only, no updated_at)
DROP TRIGGER IF EXISTS set_updated_at_assets ON public.assets;
CREATE TRIGGER set_updated_at_assets
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Auto-set institute_id triggers (matches multi-tenancy convention)
DROP TRIGGER IF EXISTS trg_assets_institute ON public.assets;
CREATE TRIGGER trg_assets_institute
  BEFORE INSERT ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();

DROP TRIGGER IF EXISTS trg_aa_institute ON public.asset_assignments;
CREATE TRIGGER trg_aa_institute
  BEFORE INSERT ON public.asset_assignments
  FOR EACH ROW EXECUTE FUNCTION public.auto_set_institute_id();

-- 7. RLS
ALTER TABLE public.assets             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_assignments  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assets_staff_all" ON public.assets;
CREATE POLICY "assets_staff_all" ON public.assets
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );

DROP POLICY IF EXISTS "aa_staff_all" ON public.asset_assignments;
CREATE POLICY "aa_staff_all" ON public.asset_assignments
  FOR ALL USING (
    public.current_user_role() IN ('owner', 'staff') AND
    institute_id = public.current_user_institute_id()
  );
