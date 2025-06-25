-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove ALL conflicting INSERT/UPDATE policies (DROP if exist)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profiles;';
    END LOOP;
END$$;

-- Add only the correct upsert ("insert or update own profile") policy
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Verification Guide: After running, run this to check the policies:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- The only active INSERT/UPDATE policy should be: "Users can insert or update their own profile"

-- Troubleshooting:
-- - Ensure both 'USING' and 'WITH CHECK' clauses exist and use (auth.uid() = id).
-- - Remove any other INSERT/UPDATE policies that might have conflicting logic.
-- - Always use double-quotes around policy names with spaces.
-- - See assets/supabase.md for advanced troubleshooting and best practices.

-- Example upsert as authenticated user (run in SQL Playground or via API):
-- insert into profiles (id, email, role) values (auth.uid(), 'test@example.com', 'citizen')
-- on conflict (id) do update set email=excluded.email, role=excluded.role;
