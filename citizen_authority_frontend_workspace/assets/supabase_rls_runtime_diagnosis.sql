-- 🚦 CivicSense RLS & auth.uid() Deep Upsert Troubleshooting

-- 1️⃣ Check runtime value of auth.uid() and row presence for the user in question
SELECT 
  auth.uid() AS runtime_uid, 
  current_user AS db_role,
  session_user,
  * 
FROM profiles
WHERE id = 'ea49ec19-7713-4fb4-bb46-d8b341368a1d';

-- 2️⃣ Try a diagnostic upsert as the user (will throw RLS error if blocked)
insert into profiles (id, email, role)
values ('ea49ec19-7713-4fb4-bb46-d8b341368a1d', 'testuser@example.com', 'citizen')
on conflict (id) do update set email=excluded.email, role=excluded.role
returning *, auth.uid() as runtime_uid;  

-- 3️⃣ List ALL active policies on profiles—should only be "Users can insert or update their own profile"
SELECT
  policyname, permissive, roles,
  cmd,
  qual AS using_clause,
  with_check
FROM pg_policies
WHERE tablename = 'profiles';

-- 4️⃣ Table and column constraints for verification (must be NOT NULL, types TEXT or UUID as configured)
SELECT
  column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles';

-- 5️⃣ No triggers should exist for the 'profiles' table
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles';

-- ℹ️ If 'runtime_uid' is NULL, or more than one insert/update policy exists, investigate config/session issues
-- ℹ️ See assets/supabase.md for full diagnosis process
