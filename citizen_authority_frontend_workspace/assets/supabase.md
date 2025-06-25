# Supabase Integration & Diagnosis Log

## Important Next Steps (RLS & Constraints for `profiles` table):

1. **Enable Row Level Security and Allow Upserts for Own Profile**
    ```sql
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can insert or update their own profile" ON profiles;
    CREATE POLICY "Users can insert or update their own profile"
      ON profiles FOR INSERT, UPDATE
      USING (auth.uid() = id);
    ```

2. **Schema Integrity:**
    Ensure `profiles` table has these columns, types, and constraints:
    - `id`   [uuid, NOT NULL, UNIQUE]   -- must match Auth user UID
    - `email` [text, NOT NULL, UNIQUE]
    - `role`  [text, NOT NULL]

    Example to enforce:
    ```sql
    ALTER TABLE profiles
      ALTER COLUMN id SET NOT NULL,
      ALTER COLUMN email SET NOT NULL,
      ALTER COLUMN role SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
    CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
    ```

3. **Verify Policy is Active and No Contradicting RLS:**
    - Use the Supabase dashboard or SQL editor to ensure that **only the above RLS policy** is active for `profiles` inserts/updates.
    - Any older conflicting RLS policies must be dropped.

4. **Troubleshooting — Checklist:**
    - If you still get "Database error saving new user" or `upsert` fails:
      1. Ensure you are passing all NOT NULL fields—esp. `id`, `email`, `role`—in every insert/upsert of `profiles`.
      2. Confirm that your client is authenticated (i.e., session exists and `auth.uid()` returns the correct value).
      3. Review database logs for constraint violation, null values, or RLS failures.

5. **Best Practice:**
    - Upsert the profile **after** the user is confirmed/logged in, or if immediate insert, handle the case where user object may be missing (common after signUp when email verification is required).

---

*This file reflects the required SQL you (or your admin) must run, since API-based inspection is not permitted from this agent workspace. Once applied, the signup/profile upsert flow should work correctly for both citizens and authorities.*

_Last update: Automated diagnosis — direct SQL actions required!_
