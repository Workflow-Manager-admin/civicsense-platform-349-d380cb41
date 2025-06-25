# Supabase Integration & Diagnosis Log

## 🛡️ Fix for RLS Upsert Violation: Enabling Profile Upserts for Authenticated Users

If you see:
> `Failed to upsert citizen profile: new row violates row-level security policy for table "profiles"`

This typically means:
- Your RLS (Row-Level Security) policy is too restrictive, missing, or is being interfered with by legacy/conflicting policies.
- The upsert/insert payload or session context is not in compliance with the expected policy or auth context (`auth.uid` ≠ payload `id`).

---

## 🛠️ STEP-BY-STEP — RESET profiles RLS TO ENABLE UPSERT FOR OWN RECORD *ONLY*

### 1️⃣ (RECOMMENDED) FULL-HEAL SQL

Copy-paste this in your Supabase SQL Editor **AFTER doing schema repair if needed (see `auto_repair_profiles.sql`)**:

```sql
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
```

_Note: This ensures **no legacy/upsert/insert policies** remain which could block or interfere._

---

### 2️⃣ VERIFY THE POLICY

Run this diagnostic SQL:

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```
- The **ONLY** INSERT/UPDATE policy should be:  
  `Users can insert or update their own profile`  
  FOR INSERT, UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id)

---

### 3️⃣ COMMON REJECT/FAILURE DIAGNOSTICS

If upsert fails with RLS violation, check:

- **Session**: Must be authenticated, and `auth.uid()` is NOT NULL.
- **Payload**: Must be exactly `{ id: user.id, email, role }`.
- **No legacy/conflicting policies**: Only the above policy should exist for INSERT/UPDATE.
- **Table Columns**:  
  `id` = TEXT or UUID PRIMARY KEY (NOT NULL)  
  `email`, `role` = TEXT NOT NULL

_See `assets/auto_repair_profiles.sql` if schema is broken (e.g. `id` not UUID/TEXT PK, columns missing, legacy triggers)._

---

### 4️⃣ TROUBLESHOOTING FLOW

- Logged in? (`supabase.auth.getSession()` and `user.id` present)
- Payload matches policy? (`id === auth.uid()`)
- Policies: No legacy insert/update policies exist? (verify SQL output above)
- Table: All required columns, types, and PK constraints?
- **Still 406/403?**  
  - Try logout/login, repeat upsert, and check diagnostic error logs in React console (see `assets/upsert_rls_diagnostics.md`).

---

### 5️⃣ DIAGNOSTIC SQL

See `assets/supabase_rls_runtime_diagnosis.sql` for full runtime inspection (current session, row, auth.uid, and triggers check).

---

_Last update: Strict profile RLS policy for citizen/authority upsert.  
**Summary:** There should be only one profiles policy for insert/update:  
`USING (auth.uid() = id) WITH CHECK (auth.uid() = id)`.  
All others **MUST** be removed for reliable login/signup._
