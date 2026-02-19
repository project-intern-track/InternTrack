-- ============================================================
-- InternTrack - Database Migration 007
-- Creates: user_settings table and trigger to auto-create settings
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  notifications_enabled BOOLEAN DEFAULT true,
  email_updates BOOLEAN DEFAULT true,
  dashboard_layout TEXT DEFAULT 'default',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Settings: users manage own"
  ON public.user_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Function to auto-create settings
CREATE OR REPLACE FUNCTION public.create_default_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on public.users
DROP TRIGGER IF EXISTS on_user_created_create_settings ON public.users;
CREATE TRIGGER on_user_created_create_settings
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_settings();
