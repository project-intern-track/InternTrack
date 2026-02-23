-- ============================================================
-- InternTrack - Database Migration 009
-- Adds: reviewed_by, reviewed_at, review_comments to tasks table
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'reviewed_by') THEN
        ALTER TABLE public.tasks ADD COLUMN reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.tasks ADD COLUMN reviewed_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'review_comments') THEN
        ALTER TABLE public.tasks ADD COLUMN review_comments TEXT;
    END IF;
END $$;

-- Policies:
-- Ensure that interns cannot update these fields?
-- This requires splitting the intern update policy or using triggers.
-- For now, relying on frontend/backend restriction, but noting this for future security hardening.
