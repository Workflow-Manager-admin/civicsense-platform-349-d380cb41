-- Enable RLS on the profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove ALL conflicting INSERT/UPDATE policies (DROP if exist)
DROP POLICY IF EXISTS "Users can insert or update their own profile" ON profiles;

-- Add only the correct upsert ("insert or update own profile") policy
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
