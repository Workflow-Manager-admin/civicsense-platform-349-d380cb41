-- ================================
-- Supabase Migration: Cross-Role Email Uniqueness in `profiles`
-- ================================

-- 1. Ensure 'email' column exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Enforce (email, role) uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_role_idx ON profiles(email, role);

-- 3. Add cross-role uniqueness trigger
CREATE OR REPLACE FUNCTION enforce_cross_role_email_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = NEW.email AND role <> NEW.role AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'This email is already used under another role. Please use a different email.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cross_role_email_uniqueness_trigger ON profiles;

CREATE TRIGGER cross_role_email_uniqueness_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_cross_role_email_uniqueness();
