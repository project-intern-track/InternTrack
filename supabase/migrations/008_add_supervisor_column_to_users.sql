-- ============================================================
-- InternTrack - Database Migration 008
-- Adds: supervisor_id and department to users table
-- Updates: handle_new_user trigger function to include new fields
-- ============================================================

-- Add supervisor_id to link interns to supervisors
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'supervisor_id') THEN
        ALTER TABLE public.users ADD COLUMN supervisor_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'department') THEN
        ALTER TABLE public.users ADD COLUMN department TEXT;
    END IF;
END $$;

-- Policies update not needed for columns, but let's index supervisor_id
CREATE INDEX IF NOT EXISTS idx_users_supervisor_id ON public.users(supervisor_id);

-- Update the handle_new_user function to include department and supervisor_id
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (
    id, email, full_name, avatar_url, role, 
    ojt_role, start_date, required_hours, ojt_type, 
    status, department, supervisor_id
  )
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
    COALESCE(NEW.raw_user_meta_data ->> 'status', 'active'),
    -- New fields
    COALESCE(NEW.raw_user_meta_data ->> 'department', NULL),
    COALESCE((NEW.raw_user_meta_data ->> 'supervisor_id')::uuid, NULL)
  );
  RETURN NEW;
END;
$$;
