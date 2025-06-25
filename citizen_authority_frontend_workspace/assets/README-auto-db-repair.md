# Automated 'profiles' Table Repair SQL — CivicSense

**⚠️ ACTION REQUIRED:**
Before running or debugging this app, you MUST run the SQL repair script (`auto_repair_profiles.sql`) in your Supabase SQL Editor.  
**If you encounter ANY errors applying the RLS policy or upsert fails with "violates row-level security", "column type" (UUID vs TEXT), or legacy triggers issues: THIS SCRIPT MUST BE RUN BEFORE THE POLICY!**

---

**How to fully heal your database for profile upserts and RLS errors:**

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
   - **No other table/policy is changed!**

5. After running, you should verify using SQL:
   ```sql
   SELECT * FROM information_schema.columns WHERE table_name = 'profiles';
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   - You MUST see:
     - `id` = UUID, primary key
     - `email`, `role` = text NOT NULL
     - **Only ONE upsert policy** as above for 'profiles'

---

**IMPORTANT:**  
- *Run this before ANY RLS policy if profile upsert or RLS configuration fails due to broken schema, triggers, or type errors.*
- If `id` values were previously TEXT, migrate or remove broken rows before running this.
- Failure to do so results in persistent 403/406 errors, "violates row-level security", or upsert failures from the React app.
- See also `assets/upsert_rls_diagnostics.md` for full troubleshooting and verification scripts.

_Last update: This script is required for all environments to resolve ALL row-level security and schema errors on user profile upserts for CivicSense.  Always repair schema before fixing RLS policy!_
