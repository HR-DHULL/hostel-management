-- Add permissions column to profiles
-- Stores module-level access for staff members.
-- Empty {} means full access (default / backward-compatible).
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '{}';
