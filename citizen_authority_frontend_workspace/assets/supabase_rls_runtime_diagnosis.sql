-- 🚦 CivicSense RLS & auth.uid() Deep Upsert Troubleshooting
-- Run this in the SQL Editor while authenticated as the affected user (if possible).
-- This will show you the runtime value of auth.uid() and all effective policies, as seen by RLS.

-- 1️⃣ What is the result of auth.uid(), and does it match your intended payload?
SELECT 
  auth.uid() AS runtime_uid, 
  current_user AS db_role,
  session_user,
  * 
FROM profiles
WHERE id = 'ea49ec19-7713-4fb4-bb46-d8b341368a1d';

-- 2️⃣ Try a diagnostic upsert in SQL to see live RLS evaluation (replace values as needed):
insert into profiles (id, email, role)
values ('ea49ec19-7713-4fb4-bb46-d8b341368a1d', 'testuser@example.com', 'citizen')
on conflict (id) do update set email=excluded.email, role=excluded.role
returning *, auth.uid() as runtime_uid;  -- Will error with details if RLS blocks it

-- 3️⃣ List EVERY active insert/update policy on 'profiles' (check for legacy/conflicting ones):
SELECT
  policyname, permissive, roles,
  cmd,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 4️⃣ Extra: Show table and column constraints
SELECT
  column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles';

-- 5️⃣ Extra: List all triggers (none should be present)
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles';

-- ℹ️ Share results—especially runtime_uid, policy list, and any error thrown in (2).
-- If 'runtime_uid' is NULL, session/auth context may be missing, which always causes RLS to fail!
-- If more than one policy is present, identify all insert/update policies.

-- For guidance, see also assets/supabase.md and upsert_rls_diagnostics.md in your frontend repo.
