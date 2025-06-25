# Supabase Integration & Diagnosis Log

## 🛡️ Fix for RLS Upsert Violation: Enabling Profile Upserts for Authenticated Users

If you see:
> `Failed to upsert citizen profile: new row violates row-level security policy for table "profiles"`

### 🛠️ Run This *Exact* SQL in Supabase SQL Editor:

```sql
-- 1. Confirm RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove ALL conflicting INSERT/UPDATE policies
DROP POLICY IF EXISTS "Users can insert or update their own profile" ON profiles;
-- (Repeat DROP for any other INSERT/UPDATE policies if they exist, e.g. 'Allow insert', 'Allow update', etc.)

-- 3. Create the correct upsert policy
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

**IMPORTANT:**
- The policy must appear as above, with both `USING` and `WITH CHECK`. (Some SQL GUIs omit `WITH CHECK` by default.)
- Only this policy (or a strict superset) should apply for INSERT/UPDATE on `profiles` to avoid conflicts.

---

### 🔍 Requirements Checklist for Profile Upsert Success

- **Auth session exists:** The user is logged in (so `auth.uid()` resolves).
- **Always upsert:** With all required fields: `{ id: auth.uid(), email, role }`
- **Profile table structure:** `id` column is `TEXT NOT NULL PRIMARY KEY` (matches Supabase Auth user ID), `email` and `role` are NOT NULL.
- **No conflicting RLS:** No other INSERT/UPDATE policy should loosen/tighten these permissions.

---

### 🚨 Still Failing? Steps to Debug

1. Go to Supabase SQL Editor and run: `SELECT * FROM pg_policies WHERE tablename = 'profiles';`
   - Only the `"Users can insert or update their own profile"` policy for `INSERT, UPDATE` should appear.
2. Test with SQL Playground as the authenticated user:
   ```sql
   insert into profiles (id, email, role) values (auth.uid(), 'test@example.com', 'citizen')
   on conflict (id) do update set email=excluded.email, role=excluded.role;
   ```
3. Make sure your code always supplies `id: auth.uid()` (no null or blank).
4. Review for constraints: `UNIQUE` on `id`, not nullable.
5. Confirm Supabase project has no custom triggers interfering.

---

_Last update: Step-by-step RLS policy SQL for profile upserts. Verified for upsert inserts & updates with Supabase Auth._
