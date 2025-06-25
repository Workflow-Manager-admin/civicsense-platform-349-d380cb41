# Supabase Integration & Diagnosis Log

## 🛡️ Fix for RLS Upsert Violation: Enabling Profile Upserts for Authenticated Users

If you see errors like:
> `Failed to upsert citizen profile: new row violates row-level security policy for table "profiles"`

### 🚦 The QUICK FIX (Run This SQL Script)

**Open the Supabase SQL Editor and run the script in `assets/auto_repair_profiles.sql`** (or copy-paste from this repo):

**Why?**  
- This script re-enables upsert for logged-in users (citizens/authorities) into their own profile only.
- Fixes schema & removes conflicting legacy policies/triggers in one step.
- No destructive operations. Only policies for 'profiles' are updated.

#### 📋 What the script does:
- Ensures:  
  - `id` is UUID PRIMARY KEY  
  - `email`, `role` columns exist, are NOT NULL  
- Drops/clears all triggers/policies on `profiles`
- Enables RLS and adds **ONLY** this policy:
  ```
  CREATE POLICY "Users can insert or update their own profile"
    ON profiles
    FOR INSERT, UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
  ```

#### ▶️ How To Run:

1. Go to Supabase project SQL Editor  
2. Paste contents of `assets/auto_repair_profiles.sql`  
   (OR use "Run SQL File" and select it)
3. Execute.
4. Done! All citizens/authorities with a Supabase Auth session can upsert their own profile (`id` must match their session user id).

### ✅ Verification / Troubleshooting

- Use this query to confirm only one insert/update policy for 'profiles':
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'profiles';
  ```
- Required columns must be:
  - `id` (UUID, PK)
  - `email` (text, not null)
  - `role` (text, not null)

- If you ever see 403 or "violates row-level security":
  - Re-run the fix script above.
  - Make sure upsert payload is `{ id: user.id, email, role }` and user is logged in.
  - There should be NO other insert/update policies active for `profiles`!

- See `assets/upsert_rls_diagnostics.md` for advanced debugging if needed.

---

**Best Practices:**  
- Use double quotes for policy names that contain spaces.
- Both `USING` and `WITH CHECK` must be: `(auth.uid() = id)`
- Remove/replace any legacy insert/update RLS policies for `profiles`.
- Don't upsert if session is missing -- session context is required!

---

_Last update: Use `auto_repair_profiles.sql` to fully recover profile upsert for authenticated users. See also supabase_applied_rls.sql for manual/CLI application._
