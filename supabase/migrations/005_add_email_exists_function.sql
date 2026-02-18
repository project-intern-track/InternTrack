-- ============================================================
-- Migration 005: Add email existence check function
-- This function allows unauthenticated users to check if an
-- email exists for password reset functionality
-- ============================================================

-- Create a function to check if email exists
-- SECURITY DEFINER allows it to bypass RLS policies
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE email = check_email
  );
END;
$$;

-- Grant execute permission to authenticated and anon users
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon;
