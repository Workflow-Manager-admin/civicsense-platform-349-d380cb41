# Automated 'profiles' Table Repair SQL — CivicSense

**⚠️ ACTION REQUIRED:**
Before running or debugging this app, you MUST run the SQL repair script (`auto_repair_profiles.sql`) in your Supabase SQL Editor. This cannot be fully automated from the code!

**How to fix your database for profile upserts and RLS errors:**

1. **Open your Supabase dashboard (https://app.supabase.com)**
2. **Go to SQL Editor**
3. **Upload or paste the contents of `assets/auto_repair_profiles.sql`**
4. **Run it** for full automated healing:
   - Ensures `id` column in `profiles` is **UUID primary key**
   - Ensures `email` and `role` columns exist (TEXT, NOT NULL)
   - Removes all triggers from `profiles`
   - Drops ALL existing RLS policies on `profiles`
   - Enables only the correct upsert policy:
     ```sql
     CREATE POLICY "Users can insert or update their own profile"
       ON profiles
       FOR INSERT, UPDATE
       USING (auth.uid() = id)
       WITH CHECK (auth.uid() = id);
     ```
   - **No other table/policy is changed.**

5. After running, you should execute these in the SQL editor to verify:
   ```sql
   SELECT * FROM information_schema.columns WHERE table_name = 'profiles';
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   - Confirm:
     - `id` = UUID, primary key
     - `email`, `role` = text NOT NULL
     - Only above upsert policy exists for 'profiles'

---

**NOTE:**  
- If `id` values were previously TEXT, you must migrate or remove broken rows before this.
- If this is not performed, you'll see 403/406 errors, "violates row-level security", and upsert failures from the React app.
- See also `assets/upsert_rls_diagnostics.md` for full troubleshooting and verification.

_Last update: This script is required for all environments to resolve ALL row-level security and schema errors on user profile upserts for CivicSense._
