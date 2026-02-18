-- ============================================================
-- InternTrack - Database Migration 002
-- Adds OJT-specific fields to users table
-- Run this in Supabase Dashboard > SQL Editor if the users table already exists
-- ============================================================

-- Add new columns to users table if they don't exist
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS ojt_role TEXT,
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS required_hours INTEGER,
  ADD COLUMN IF NOT EXISTS ojt_type TEXT DEFAULT 'required' CHECK (ojt_type IN ('required', 'voluntary'));

-- Update the trigger function to include new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role, ojt_role, start_date, required_hours, ojt_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'intern'),
    COALESCE(NEW.raw_user_meta_data ->> 'ojt_role', NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'start_date')::date, NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'required_hours')::integer, NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'ojt_type', 'required')
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- DONE! Users table updated with OJT fields
-- ============================================================
