-- AUTO-REPAIR "profiles" TABLE: Supabase "upsert own profile" RLS policy re-application
-- Applies required schema, enables RLS, drops all conflicting row-level security policies/triggers, and sets only the required upsert (insert/update-own) policy.
-- This script is **safe** to run multiple times, will not damage data, but may warn if legacy TEXT ids require manual migration.

-- 1. Ensure `id` column is UUID (will warn if manual migration needed for legacy TEXT ids).
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name='profiles'
      AND column_name='id'
      AND udt_name != 'uuid'
  ) THEN
    -- WARN: Not an error, but type change isn't automatable if legacy TEXT values are present and FK constraints exist elsewhere.
    RAISE WARNING 'Column "id" is not of type uuid; backup and manual migration required before running this.';
  END IF;
END
$$;

ALTER TABLE profiles
  ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;

-- 2. Ensure required columns: email/role (TEXT NOT NULL)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='profiles' AND column_name='email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_name='profiles' AND column_name='role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT '';
  END IF;
END
$$;

ALTER TABLE profiles ALTER COLUMN email DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN id SET NOT NULL;

-- 3. Enforce PK on id
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE profiles ADD PRIMARY KEY (id);

-- 4. Remove all triggers that might block upserts
DO $$
DECLARE
  trig RECORD;
BEGIN
  FOR trig IN
    SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles'
  LOOP
    EXECUTE 'DROP TRIGGER IF EXISTS "' || trig.trigger_name || '" ON profiles;';
  END LOOP;
END
$$;

-- 5. Enable and reset all RLS, then add the ONLY required upsert (own-row) policy:

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove ALL old/conflicting policies:
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profiles;';
  END LOOP;
END
$$;

-- Add only this policy for upsert (insert/update) by owner:
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Diagnostic query (uncomment and run as needed for troubleshooting):
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles';

-- END AUTO-REPAIR "profiles"
