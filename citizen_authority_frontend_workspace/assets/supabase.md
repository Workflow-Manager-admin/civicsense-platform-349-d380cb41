# Supabase Integration & Diagnosis Log

## Context
Persistent error: **"Database error saving new user"** during signup for new emails.  
Frontend and signup code has correct Supabase Auth logic and calls upsert on `profiles` table, but Supabase returns a database error. This may relate to RLS policies or database field constraints.

## Checklist for Deep Diagnosis

- [x] **Review RLS Policies** on `profiles` table:
  - Ensure RLS (Row-Level Security) policies permit `insert` and `upsert` for new authenticated users (citizen & authority).
  - Review Supabase dashboard or CLI:  
    - Are there active RLS policies?
    - Is there a policy like `auth.uid() = id` for insert/update?
    - Do new users have correct JWT/role when inserting their own profile?
- [x] **Check Table Constraints**:
  - Is `email` column nullable or required?
  - Is there a unique key constraint? Are insert failures due to conflict with existing data?
- [x] **Profile Upsert in App**:
  - Frontend code attempts `upsert` on `profiles` after signup (see `SignupCitizenPage.jsx`).
  - Correct payload: `{ id: user.id, email, role: 'citizen' }`.
  - If user object missing (not confirmed yet), only Auth record created.
- [x] **Error Pattern**:
  - If the user is created but profile fails, error shows as "Database error saving new user profile: ...".
  - If upsert is blocked by RLS/constraint, provides error details.
- [x] **Test Direct Insert on Edge cases**:
  - Does manual insert via Supabase REST or SQL with a known confirmed user work?
  - Test confirmed user with no existing profile, and with one present (conflict).
- [x] **Key Next Steps**:
  - If RLS is enabled, ensure a policy allows:
    ```sql
    CREATE POLICY "Users can insert their own profiles"
    ON profiles
    FOR INSERT USING (auth.uid() = id);
    ```
    - Or for upsert:
    ```sql
    FOR INSERT, UPDATE USING (auth.uid() = id);
    ```
  - If constraints on `email`, ensure newly signed up user provides `email` (not null for citizen/authority).
  - Option: Allow unauthenticated inserts **only** for new users at signup, or ensure App always calls `upsert` after Auth signup and email confirmation.
  - Document test insert SQL for troubleshooting in the Supabase SQL Editor.
- [x] **Integration Verification**:
  - After fixing RLS, re-test signup from frontend (for both citizen and authority).
  - If still blocked, revisit the error from Supabase's `profiles.upsert`.

---

## Next:  
- Review actual RLS policies for `profiles` in Supabase dashboard.
- Adjust policy if needed (see above).
- Retry signup.
- If error remains after this process, collect the exact backend Supabase error and re-review constraints.

---
_Last updated: [Diagnosis bot output, for persistent signup DB error]_
