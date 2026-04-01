-- Add total_library_seats to app_settings
ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS total_library_seats INT NOT NULL DEFAULT 50;
