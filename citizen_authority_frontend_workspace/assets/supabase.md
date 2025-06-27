# Supabase Integration & Diagnosis Log

---

## [2024-06-25] Attempted Programmatic Schema Update for Soft-Delete in 'issues' Table

- **Context**: Per frontend/authority dashboard requirements and this file, schema migration was attempted to add:
  - `deleted_by_authority BOOLEAN DEFAULT NULL`
  - `deleted_at TIMESTAMPTZ DEFAULT NULL`
- **Automated Attempt**: Automated schema tools could not run due to missing `public.run_sql` Postgres RPC in current Supabase project.
- **ACTION REQUIRED**: If running initial deployment/migration, run the following in Supabase SQL Editor:
  ```sql
  ALTER TABLE issues ADD COLUMN IF NOT EXISTS deleted_by_authority boolean;
  ALTER TABLE issues ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
  ```
- Once complete, the frontend will be able to (soft-)delete issues and filter by these fields for the Authority Dashboard.

---

## 🛡️ Fix for RLS Upsert Violation: Enabling Profile Upserts for Authenticated Users

If you see:
> `Failed to upsert citizen profile: new row violates row-level security policy for table "profiles"`

---

## 🗑️ Authority "Soft Delete" for Issues — Required Table Fields

To enable the "Deleted Issues" view and retain deleted issues for authorities:
- **Add the following fields to `issues` table**:
    - `deleted_by_authority` BOOLEAN DEFAULT NULL
    - `deleted_at` TIMESTAMPTZ DEFAULT NULL

**How it works:**
- When an authority deletes an issue, mark `deleted_by_authority=true` and set `deleted_at` to `now()` (not physical deletion).
- "Reported Issues" tab only shows records where `deleted_by_authority` is NULL.
- "Deleted Issues" tab lists all with `deleted_by_authority = true`.

**SQL to add these columns (if not present):**
```sql
ALTER TABLE issues ADD COLUMN IF NOT EXISTS deleted_by_authority boolean;
ALTER TABLE issues ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
```

- Update RLS as needed: authorities should be able to SELECT * from both sets.

---


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
