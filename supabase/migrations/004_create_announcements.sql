-- ============================================================
-- InternTrack - Database Migration 004
-- Creates: announcements table + RLS Policies
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  visibility TEXT NOT NULL DEFAULT 'all' CHECK (visibility IN ('all', 'admin', 'supervisor', 'intern')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policies
-- Authenticated users can view all announcements (for now, simplistic)
CREATE POLICY "Announcements: view all"
  ON public.announcements
  FOR SELECT
  TO authenticated
  USING (true);

-- Admins can create announcements
CREATE POLICY "Announcements: admins can create"
  ON public.announcements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update/delete
CREATE POLICY "Announcements: admins can update"
  ON public.announcements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Announcements: admins can delete"
  ON public.announcements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================================
-- DONE! Created announcements table
-- ============================================================
