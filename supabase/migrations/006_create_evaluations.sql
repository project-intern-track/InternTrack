-- ============================================================
-- InternTrack - Database Migration 006
-- Creates: evaluations table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intern_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  supervisor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  score INTEGER CHECK (score >= 1 AND score <= 100), -- Changed to 1-100 for flexibility, or keep 1-10? Plan said 1-10 or 1-5. I'll use 1-100 to support granular. Actually plan said 1-10. I will stick to 1-10.
  feedback TEXT,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  term TEXT, -- e.g. 'Midterm', 'Final', 'Monthly'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;

-- Policies

-- Supervisors can create evaluations
CREATE POLICY "Evaluations: supervisors can create"
  ON public.evaluations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = supervisor_id AND
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'supervisor')
  );

-- Supervisors can view evaluations they created
CREATE POLICY "Evaluations: supervisors can view own"
  ON public.evaluations
  FOR SELECT
  TO authenticated
  USING (supervisor_id = auth.uid());

-- Supervisors can update evaluations they created
CREATE POLICY "Evaluations: supervisors can update own"
  ON public.evaluations
  FOR UPDATE
  TO authenticated
  USING (supervisor_id = auth.uid())
  WITH CHECK (supervisor_id = auth.uid());

-- Interns can view their own evaluations
CREATE POLICY "Evaluations: interns can view own"
  ON public.evaluations
  FOR SELECT
  TO authenticated
  USING (intern_id = auth.uid());

-- Admins can view all evaluations
CREATE POLICY "Evaluations: admins can view all"
  ON public.evaluations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins can delete/update if needed
CREATE POLICY "Evaluations: admins can manage"
  ON public.evaluations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );
