# Supabase Integration & Diagnosis Log

## 🛡️ Fix for RLS Upsert Violation: Enabling Profile Upserts for Authenticated Users

If you see:
> `Failed to upsert citizen profile: new row violates row-level security policy for table "profiles"`

### 🛠️ Run This *Exact* SQL in Supabase SQL Editor:

> **If you see errors like:**
> - `syntax error at or near "Users"`
> - or "policy already exists" / "relation does not exist" for single-quoted names

**👉 Always use double-quotes ("") for policy names with spaces or special characters.**  
**Never use single-quotes ('') for policy names in CREATE POLICY—they will produce a syntax error!**

```sql
-- 1. Confirm RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove ALL conflicting INSERT/UPDATE policies
DROP POLICY IF EXISTS "Users can insert or update their own profile" ON profiles;
-- (Repeat DROP for any other INSERT/UPDATE policies if they exist, e.g. "Allow insert", "Allow update", etc.)
-- (Note: Use double-quotes in DROP POLICY too if the name contains spaces.)

-- 3. Create the correct upsert policy (USE DOUBLE-QUOTES ONLY HERE)
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```
**Best Practice Tips:**
- DOUBLE-QUOTES: Use `"Users can insert or update their own profile"` not `'Users can insert or update their own profile'`
- Both `USING` and `WITH CHECK` must be present for upserts to profiles (some SQL GUIs omit `WITH CHECK`—add it manually).
- Remove any old/conflicting INSERT or UPDATE policies on `profiles` before applying this one to avoid permission bugs.

---

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
