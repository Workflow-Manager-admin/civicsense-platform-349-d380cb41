# Supabase Integration & Diagnosis Log

## Context
Persistent error: **"Database error saving new user"** during signup for new emails.  
Frontend and signup code has correct Supabase Auth logic and calls upsert on `profiles` table, but Supabase returns a database error. This may relate to RLS policies or database field constraints.

## Checklist for Deep Diagnosis

- [x] **Review RLS Policies** on `profiles` table:
  - Ensure RLS (Row-Level Security) policies permit `insert` and `upsert` for new authenticated users (citizen & authority).
  - Review Supabase dashboard or CLI.  
- [x] **Check Table Constraints**:
  - Is `email` column nullable or required?
    - `email` column in `profiles` must be NOT NULL and UNIQUE.
  - Is there a unique key constraint? Are insert failures due to conflict with existing data?
    - If NOT NULL or UNIQUE constraint is violated, Supabase returns a constraint/violations error.
- [x] **Profile Upsert in App**:
  - Frontend and backend must always upsert to `profiles` **after confirming a non-null `user` object with both `id` AND `email`**.
  - Example canonical payload: `{ id: user.id, email: user.email, role: 'citizen'|'authority' }`
  - Never allow any insert that omits or sends null/empty for required columns (`id`, `email`, `role`).
  - If user object missing (not confirmed yet), only Auth record created, **DO NOT insert profile at this point**.
- [x] **Error Pattern**:
  - If the user is created but profile fails, error shows as "Database error saving new user profile: ...".
  - If upsert is blocked by RLS/constraint, provides error details.
- [x] **Test Direct Insert on Edge cases**:
  - Does manual insert via Supabase REST or SQL with a known confirmed user (with both id and email and matching Auth record) work?
  - Test confirmed user with no existing profile, and with one present (conflict). **Insert must provide all: `id`, `email`, `role`.**
- [x] **Key Next Steps**:
  - If RLS is enabled, ensure a policy allows:
    ```sql
    CREATE POLICY "Users can insert or update their own profile"
    ON profiles
    FOR INSERT, UPDATE
    USING (auth.uid() = id);
    ```
    - This policy is ESSENTIAL and must be enabled for `profiles` or upserts will silently fail with "Database error" or "not permitted."
  - If constraints on `email`, ensure all upserts include non-null unique `email` at all times. **Do not upsert if `user.email` or `user.id` is missing.**
  - Only allow insert/upsert after Auth signup has returned the complete user object (i.e., after confirmation).
  - Document test insert SQL for troubleshooting in the Supabase SQL Editor:

---


## Common Problems and Solutions Checklist

- If **RLS is enabled** but you have *no policy* for `insert`, the app will give a generic "Database error saving new user" when upserting into `profiles`. **Solution:** Create a policy as shown above.
- If **`email` is non-nullable** and app does not supply it due to missing user object, you will get a "null value in column email" error.  **Solution:** Always upsert `{ id: user.id, email, role }` after `signUp`, and only after verification for providers where user is not returned until confirmation.
- If **unique/primary key constraint** on `id` or `email` fails due to duplicate, you get "duplicate key value violates unique constraint" error. Only insert if no row exists.
- **NOTE**: On **initial sign up**, Supabase often *does not return `user`* until the email is confirmed. Upsert profile *after confirmation* (i.e., in the login flow), not during initial sign up.
- For **citizens** and **authorities**, upsert should always use `{ id: user.id, email, role }` from the *confirmed* user object.

---

## Concrete Next Steps

1. **Signup handler should NOT upsert profiles if `user` is missing** (no insert without a valid id).
    - After confirmation, login flow should insert profile if not present.
2. **Check RLS policy:**  
    - If missing, add:  
    ```sql
    CREATE POLICY "Users can insert or update their own profile"
    ON profiles
    FOR INSERT, UPDATE USING (auth.uid() = id);
    ```
3. **Schema:**  
    - `id` must match auth.uid(), `email` should be unique and NOT NULL.
    - All upserts must include `id`, `email`, and `role`.
4. **Debug**:  
    - If error persists, collect full Supabase error message and include here for further diagnosis.

---

## Example: Safe Upsert Flow

- On initial signup, collect email and password, call `signUp`.
    - If you receive no `user` object, notify user to check email and login after confirmation.
    - On login, after `auth.signInWithPassword`, check if profile exists:
      - If not, insert a row `{ id: user.id, email: user.email, role }`, which will be allowed if RLS policy is correct.

---

## SQL for Policy

```sql
-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow users to insert/update their own profile
CREATE POLICY "Users can insert or update their own profile"
ON profiles
FOR INSERT, UPDATE
USING (auth.uid() = id);
```

---

_Last updated: [Bug diagnosis agent, actionable checklist for persistent signup DB error]_
