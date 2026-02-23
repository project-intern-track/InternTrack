-- ============================================================
-- InternTrack - Database Migration 001
-- Creates: users, tasks, attendance tables + RLS Policies
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- ========================================
-- 1. USERS TABLE (Public Profile)
-- Extends Supabase auth.users
-- ========================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'intern' CHECK (role IN ('admin', 'supervisor', 'intern')),
  ojt_role TEXT,
  start_date DATE,
  required_hours INTEGER,
  ojt_type TEXT DEFAULT 'required' CHECK (ojt_type IN ('required', 'voluntary')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies for users
-- Everyone authenticated can read all user profiles
CREATE POLICY "Users: anyone authenticated can view all profiles"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users: can update own profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can insert new user profiles (e.g. when inviting interns)
CREATE POLICY "Users: admins can insert"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any user profile
CREATE POLICY "Users: admins can update any profile"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete user profiles
CREATE POLICY "Users: admins can delete"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ========================================
-- 2. TASKS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  due_date TIMESTAMPTZ,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policies for tasks
-- Admins and supervisors can view all tasks
CREATE POLICY "Tasks: admins and supervisors can view all"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Interns can view only their own assigned tasks
CREATE POLICY "Tasks: interns can view own tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (assigned_to = auth.uid());

-- Admins and supervisors can create tasks
CREATE POLICY "Tasks: admins and supervisors can create"
  ON public.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Admins and supervisors can update any task
CREATE POLICY "Tasks: admins and supervisors can update"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Interns can update only their own tasks (e.g. change status to in-progress/done)
CREATE POLICY "Tasks: interns can update own tasks"
  ON public.tasks
  FOR UPDATE
  TO authenticated
  USING (assigned_to = auth.uid())
  WITH CHECK (assigned_to = auth.uid());

-- Admins can delete tasks
CREATE POLICY "Tasks: admins can delete"
  ON public.tasks
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ========================================
-- 3. ATTENDANCE TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  time_in TIMESTAMPTZ,
  time_out TIMESTAMPTZ,
  total_hours FLOAT,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late', 'excused')),
  created_at TIMESTAMPTZ DEFAULT now(),
  -- Prevent duplicate attendance entries for the same user on the same day
  UNIQUE (user_id, date)
);

-- Enable RLS
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- Policies for attendance
-- Admins and supervisors can view all attendance records
CREATE POLICY "Attendance: admins and supervisors can view all"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'supervisor')
    )
  );

-- Interns can view only their own attendance
CREATE POLICY "Attendance: interns can view own records"
  ON public.attendance
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Interns can insert their own attendance (clock in)
CREATE POLICY "Attendance: interns can clock in"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Interns can update their own attendance (clock out)
CREATE POLICY "Attendance: interns can update own records"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can insert attendance records (manual entry)
CREATE POLICY "Attendance: admins can insert"
  ON public.attendance
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update any attendance record
CREATE POLICY "Attendance: admins can update any"
  ON public.attendance
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can delete attendance records
CREATE POLICY "Attendance: admins can delete"
  ON public.attendance
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );


-- ========================================
-- 4. HELPER: Auto-create user profile on signup
-- This trigger automatically creates a row in public.users
-- when a new user signs up via Supabase Auth.
-- ========================================
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

-- Drop trigger if it already exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- DONE! Tables created: users, tasks, attendance
-- RLS Policies applied for role-based access control
-- Trigger set up for automatic profile creation on signup
-- ============================================================
