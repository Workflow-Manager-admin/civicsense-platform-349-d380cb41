# Supabase Integration & Diagnosis Log

## 🛡️ Fix for RLS Upsert Violation: Enabling Profile Upserts for Authenticated Users

If you see:
> `Failed to upsert citizen profile: new row violates row-level security policy for table "profiles"`

---

## 🛠️ STEP BY STEP SQL: RLS ENABLE/RESET FOR profiles

**Run this SQL in Supabase SQL Editor:**

```sql
-- Clean up all policies and apply ONLY the correct one for upsert!
-- 1. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove ALL INSERT/UPDATE policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON profiles;';
    END LOOP;
END$$;

-- 3. Create the correct upsert policy
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
- There should only be the "Users can insert or update their own profile" policy for inserts/updates.

### ⚠️ Additional Troubleshooting

- Both `USING (auth.uid() = id)` and `WITH CHECK (auth.uid() = id)` must be present.
- Authenticated session *must* exist at insert time (`auth.uid()` is NOT NULL).
- Upsert payload must use `{id: user.id, email, role}` (nothing else!).
- Table columns must be: `id` (TEXT, PK, NOT NULL), `email` (TEXT, NOT NULL), `role` (TEXT, NOT NULL).

---

### Still Failing Checklist

- You must be logged in; session/auth context required (`auth.uid()` is current user).
- Upserts must use all three fields and NOT supply bad/null `id`.
- No "legacy" or extra conflicting INSERT/UPDATE policies on table.
- Table schema must match: `id` TEXT NOT NULL PRIMARY KEY, `email`, `role` TEXT NOT NULL.

---

_Last update: Best practices to guarantee citizen/authority profile upsert in Supabase, resolving all known RLS and API key issues. See also supabase_applied_rls.sql for actual deployment SQL._
