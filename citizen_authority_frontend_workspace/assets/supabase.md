# Supabase Integration & Diagnosis Log

## 🛡️ Fix for RLS Upsert Violation: Enabling Profile Upserts for Authenticated Users

If you see:
> `Failed to upsert citizen profile: new row violates row-level security policy for table "profiles"`

---

## 🛠️ STEP BY STEP SQL: RLS ENABLE/RESET FOR profiles

**Run this SQL in Supabase SQL Editor:**

```sql
-- 1. Confirm RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove ALL conflicting INSERT/UPDATE policies
DROP POLICY IF EXISTS "Users can insert or update their own profile" ON profiles;
-- (Repeat DROP for any other INSERT/UPDATE policies if they exist, e.g. "Allow insert", "Allow update", etc.)

-- 3. Create the correct upsert policy (USE DOUBLE-QUOTES ONLY)
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

### ✅ Verification

After applying, check policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```
There should be only one INSERT/UPDATE policy present for 'profiles':
- **"Users can insert or update their own profile"** with `USING (auth.uid() = id)` and `WITH CHECK (auth.uid() = id)`

### ⚠️ Best Practices

- DOUBLE-QUOTES for names with spaces: `"Users can insert or update their own profile"`
- Always provide *both* `USING` and `WITH CHECK` clauses.
- REMOVE conflicting or legacy policies, or your application may see silent permission failures.
- No other tables need insert/update profile policies unless your schema requires them.

---

### 🚨 Still Failing? Checklist

- Auth session: user must be logged in (so `auth.uid()` works).
- Upsert: always supply all required fields, especially `id: auth.uid()`
- Table structure: `id` is `TEXT NOT NULL PRIMARY KEY`, and `email`, `role` as NOT NULL.
- No conflicting policies – run `SELECT * FROM pg_policies...` to confirm!

---

_Last update: policy SQL and best practices to resolve all profile upsert RLS and API key permission issues in Supabase. See also supabase_applied_rls.sql for deployment._
