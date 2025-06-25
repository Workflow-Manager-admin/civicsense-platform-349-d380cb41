# Supabase Integration & Diagnosis Log

## Important Next Steps (RLS & Constraints for `profiles` table):

1. **Enable Row Level Security and Allow Upserts for Own Profile**
    ```sql
    ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
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

3. **Verify**: Use Supabase SQL Editor or dashboard to run the above. Only after this will signup/upsert work correctly.

---

*This documentation update reflects the required SQL you (or your admin) must run, since API-based inspection is not permitted from this agent workspace. Once applied, the signup/profile upsert flow should work without "Database error saving new user" for both citizens and authorities.*

_Last update: Automated diagnosis - direct SQL actions required!_
