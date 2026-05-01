-- ============================================================
-- HAZEON HMS - Decouple Assets from Expenses
-- Asset register is now a standalone module. Expenses no longer
-- carries the asset-purchase flag, and assets no longer reference
-- a specific expense row.
--
-- Adds vendor column on assets so the standalone asset form can
-- capture purchase source without going through the expense ledger.
--
-- KEEPS:
--   * expenses.given_to (still useful for non-asset expenses,
--     e.g. "money/stock for mess kitchen")
--   * assets.purchase_amount, assets.purchase_date (now populated
--     directly from the asset entry form)
-- ============================================================

-- 1. Drop the asset-purchase flag on expenses
ALTER TABLE public.expenses
  DROP COLUMN IF EXISTS is_asset_purchase;

-- 2. Drop the FK from assets to expenses (no longer linked)
ALTER TABLE public.assets
  DROP COLUMN IF EXISTS expense_id;

-- The corresponding index goes away automatically when the column drops.

-- 3. Add vendor column on assets (captured directly via asset form)
ALTER TABLE public.assets
  ADD COLUMN IF NOT EXISTS vendor TEXT;
