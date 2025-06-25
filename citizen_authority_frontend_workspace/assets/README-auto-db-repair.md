# Automated 'profiles' Table Repair SQL — CivicSense

Place this file in your assets folder to enable full healing of the Supabase 'profiles' table.
**Admin Instructions:**

1. Open the Supabase dashboard.
2. Go to SQL Editor.
3. Paste the contents of `auto_repair_profiles.sql` into a new SQL script.
4. Run the script for instant healing: this will
   - Ensure 'id' column is **UUID primary key**
   - Ensure 'email' and 'role' columns exist (TEXT, NOT NULL)
   - Remove all triggers from 'profiles'
   - Drop ALL existing RLS policies on 'profiles'
   - Enable only the *correct* policy:
     ```
     CREATE POLICY "Users can insert or update their own profile"
       ON profiles
       FOR INSERT, UPDATE
       USING (auth.uid() = id)
       WITH CHECK (auth.uid() = id);
     ```
   - NO other side effects.

5. After execution, run:
   ```sql
   SELECT * FROM information_schema.columns WHERE table_name = 'profiles';
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   Ensure that:
   - id = uuid, primary key
   - email, role = text NOT NULL
   - Only one RLS policy exists as above.

**NOTE:**  
If ids were previously text, you may need to manually migrate old data or users, as re-casting to uuid will fail if any rows do not match uuid format. Clean up broken ids before running this!

_Last update: full auto-repair healer for Supabase citizen/authority login and signup, for CivicSense platform._
