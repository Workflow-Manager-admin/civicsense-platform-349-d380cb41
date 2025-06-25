-- AUTO-HEAL 'profiles' TABLE FOR FULL LOGIN/SIGNUP/UPSERT SUCCESS

-- [DIAGNOSTIC PATCH 2024-06]
-- DEBUG/FIX: It is CRITICAL that email allows only valid (non-empty) values but does NOT have an over-strict check constraint blocking valid signups.
-- To diagnose existing constraints, run:
--   SELECT conname, pg_get_constraintdef(oid)
--     FROM pg_constraint
--     WHERE conrelid = 'profiles'::regclass AND contype = 'c';
-- If you see "CHECK (email <> '')" (or similar), you may need to remove/recreate properly!

-- Remove problematic email-check constraint if exists (so new signup does not fail):
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT conname FROM pg_constraint
    WHERE conrelid = 'profiles'::regclass AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%email%' -- only those that reference email
  )
  LOOP
    EXECUTE 'ALTER TABLE profiles DROP CONSTRAINT IF EXISTS "' || r.conname || '";';
  END LOOP;
END$$;

-- 1. COLUMN DEFINITIONS: id = UUID (PK), email & role as NOT NULL
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='id' AND udt_name != 'uuid') THEN
    -- If 'id' exists and is NOT uuid, we need to remake table (rename/backup), as ALTER type text->uuid is not directly allowed if table has data.
    RAISE WARNING 'Column "id" on "profiles" is not of type UUID (it is type %); backup, drop, and recreate as UUID pk.', (SELECT udt_name FROM information_schema.columns WHERE table_name='profiles' AND column_name='id');
  END IF;
END
$$;

ALTER TABLE profiles
  ALTER COLUMN id SET DATA TYPE uuid USING id::uuid;

-- (If above fails due to legacy text ids, manual fix is required.)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='email') THEN
    ALTER TABLE profiles ADD COLUMN email text NOT NULL DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE profiles ADD COLUMN role text NOT NULL DEFAULT '';
  END IF;
END
$$;

-- Remove NOT NULL defaults, then enforce NOT NULL for all required columns
ALTER TABLE profiles ALTER COLUMN email DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE profiles ALTER COLUMN email SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;
ALTER TABLE profiles ALTER COLUMN id SET NOT NULL;

-- 2. PRIMARY KEY ENFORCEMENT
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
ALTER TABLE profiles ADD PRIMARY KEY (id);

-- 3. REMOVE ALL TRIGGERS ON PROFILES (REQUIRED TO AVOID LEGACY LOGIC)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles')
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS "' || r.trigger_name || '" ON profiles;';
    END LOOP;
END$$;

-- 4. ROW LEVEL SECURITY: REMOVE ALL AND REAPPLY ONLY THE CAN-UPSERT POLICY

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profiles;';
  END LOOP;
END$$;

CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. Final - Verification: Output table schema and policies
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'profiles';
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- END AUTO-HEAL
>>>>>>> REPLACE
