# Supabase Integration – Cross-Role Email Uniqueness in `profiles`

## Requirement
Enforce that the same email cannot be used with more than one role in the `profiles` table. That is:
- Each (`email`, `role`) pair in `profiles` must be unique.
- If a new `profiles` row is inserted or updated with an email which already exists but under a different role, the operation must be blocked with the error:  
  **"This email is already used under another role. Please use a different email."**

## Steps to Implement

### 1. Email/Role Columns
- Ensure the `profiles` table has `id`, `email`, and `role` columns.
- `id`: UUID/auth user ID, `email`: string, `role`: string (`citizen` or `authority`).

### 2. Unique Composite Index
- Create a unique index on (`email`, `role`) for fast lookup and to prevent duplicate role assignments with the same email.
- Alone, this does NOT block the same email for two different roles, so a trigger is still required.

### 3. Uniqueness & Policy (Trigger Function)
- Add a BEFORE INSERT OR UPDATE trigger that:
    1. Checks if any other row exists for the new email with a different role.
    2. If so, raises a PG error:  
      `RAISE EXCEPTION 'This email is already used under another role. Please use a different email.'`
    3. Allows insert/update if not.

#### Example SQL

```sql
-- 1. Add email column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Add composite unique constraint (prevents exact duplicates)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_email_role_idx ON profiles(email, role);

-- 3. Add cross-role uniqueness trigger
CREATE OR REPLACE FUNCTION enforce_cross_role_email_uniqueness()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = NEW.email AND role <> NEW.role AND id <> NEW.id
  ) THEN
    RAISE EXCEPTION 'This email is already used under another role. Please use a different email.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cross_role_email_uniqueness_trigger ON profiles;

CREATE TRIGGER cross_role_email_uniqueness_trigger
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION enforce_cross_role_email_uniqueness();
```

### 4. Application Logic for Signup/Login
- When a new signup is completed, insert into `profiles` with both `email` and role.
- On login, use the `email` to fetch and confirm the user's allowed role via `profiles`.

### 5. Testing/Error Surfaces
- If the error above is hit, surface to the user in sign-up or profile role-change flows.

## Summary

- Add/ensure `email` column on `profiles`.
- Enforce (email, role) composite uniqueness via index.
- Prevent email-in-use-across-different-role via trigger (raises error when violated).
- Use email and role in all inserts and key user flows.

This solution leverages PostgreSQL constraints and triggers in Supabase SQL Editor.
