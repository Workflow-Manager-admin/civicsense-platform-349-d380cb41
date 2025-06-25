# Supabase Integration & Diagnosis Log

## 📣 Run the following SQL in Supabase SQL Editor to fix signup/profile upsert errors:

### 1. Add missing columns (`email`, `role`) as `text NOT NULL`
```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email text NOT NULL,
  ADD COLUMN IF NOT EXISTS role text NOT NULL;
```

### 2. Ensure required constraints and unique indexes
```sql
ALTER TABLE profiles
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN email SET NOT NULL,
  ALTER COLUMN role SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS profiles_id_idx ON profiles(id);
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_idx ON profiles(email);
```

### 3. Enable Row Level Security (RLS) and allow users to upsert (insert/update) only their own profile:
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert or update their own profile" ON profiles;
CREATE POLICY "Users can insert or update their own profile"
  ON profiles FOR INSERT, UPDATE
  USING (auth.uid() = id);
```

> **Instructions:**  
> - Paste and run the above SQL (all together, or section by section) inside Supabase SQL Editor.
> - If columns already exist, `ADD COLUMN IF NOT EXISTS` is harmless.
> - You may verify in the dashboard that columns now exist and roles/policies are set as described.

---

## **Troubleshooting Checklist**

- Confirm you pass all of these when inserting/upserting `profiles`:
  - `id` (auth UID), `email`, `role` (e.g., 'citizen' or 'authority')
- Make sure all of these are `NOT NULL` and **unique** where required.
- Only the shown RLS policy should be enabled for `profiles` inserts/updates (no legacy/conflicting policies).
- User session/auth should be valid (`auth.uid()` present).

---

_Last update: Automated SQL fix for email/role bug and full schema/policy alignment._
