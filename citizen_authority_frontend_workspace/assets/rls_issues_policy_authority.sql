-- CivicSense: Enable Row Level Security and allow authority users to SELECT all issues

ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Remove all legacy/conflicting SELECT policies for 'issues'
DO $$
DECLARE 
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'issues' AND cmd = 'select'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON issues;';
    END LOOP;
END$$;

-- Policy: Allow all users whose profile role is 'authority' to see all issues
CREATE POLICY "Authorities can view all issues"
  ON issues
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'authority'
    )
  );

-- (Optional) Citizens can see their own issues only:
-- CREATE POLICY "Citizens can view their own issues"
--   ON issues
--   FOR SELECT
--   USING (citizen_id = auth.uid());

-- NOTE: After applying, test as both authority and citizen logins.
