-- ============================================================
-- InternTrack - Database Migration 003
-- Adds ojt_id and status columns to the users table
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- Add status column to track active/archived interns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived'));

-- Add ojt_id column — a sequential, human-readable intern identifier
-- We use a sequence starting at 1101 to match the design
CREATE SEQUENCE IF NOT EXISTS public.ojt_id_seq START WITH 1101;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS ojt_id INTEGER UNIQUE DEFAULT nextval('public.ojt_id_seq');

-- Update the trigger function to include the new fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url, role, ojt_role, start_date, required_hours, ojt_type, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'intern'),
    COALESCE(NEW.raw_user_meta_data ->> 'ojt_role', NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'start_date')::date, NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'required_hours')::integer, NULL),
    COALESCE(NEW.raw_user_meta_data ->> 'ojt_type', 'required'),
    'active'
  );
  RETURN NEW;
END;
$$;

-- ============================================================
-- DONE! Users table updated with ojt_id and status columns
-- ============================================================
