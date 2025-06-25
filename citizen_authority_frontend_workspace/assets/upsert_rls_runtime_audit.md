# Supabase "profiles" RLS Runtime Audit — CivicSense

## 1. Frontend Supabase Client Configuration: Key & Project

- **Frontend Project URL:**  
  `https://kwznqztqlvkeoxjzlhkm.supabase.co`
- **Frontend API Key:**  
  ```
  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk
  ```

- **Key Decoded (jwt.io):**
  - role: `anon` (the correct, public key)
  - This is *not* a service_role key.  
  - The frontend is **not** exposing any privileged key.

- **Frontend Initialization (src/supabase/supabaseClient.js):**
  ```
  createClient(
    "https://kwznqztqlvkeoxjzlhkm.supabase.co",
    "<anon-public-key>",
    { ... }
  )
  ```
  - All client `upsert`/`insert` actions are performed using a valid Supabase *anon* session and never the service key.

---

## 2. Upsert/Session Debug Context (from live error):

- **Upsert Error**  
  ```
  LoginCitizenPage.jsx:79 [DIAG] Upsert failed with error: {code: '42501', message: 'new row violates row-level security policy for table "profiles"'} Payload: {id: 'ea49ec19-7713-4fb4-bb46-d8b341368a1d', email: 'yukthasri1625@gmail.com', role: 'citizen'}
  ```
- **Session User**
  ```json
  {
    "id": "ea49ec19-7713-4fb4-bb46-d8b341368a1d",
    "role": "authenticated",
    "email": "yukthasri1625@gmail.com",
    "app_metadata": {"provider": "email", "providers": ["email"]},
    "user_metadata": {"email": "yukthasri1625@gmail.com", "email_verified": true}
  }
  ```

- **Payload**  
  ```json
  {
    "id": "ea49ec19-7713-4fb4-bb46-d8b341368a1d",
    "email": "yukthasri1625@gmail.com",
    "role": "citizen"
  }
  ```

> **The upsert payload and session user `id` are identical.**
> *This means, by logic, the RLS `auth.uid() = id` check should allow upsert.*

---

## 3. Current Policies on 'profiles' Table

*The following audit steps are verified by running:*

```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### Expected Policy

There must be exactly **one** policy (no legacy/conflicting policies):

```sql
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```
- No other insert/update policy should exist for 'profiles'.
- No legacy/alternate policies present.

---

## 4. Table and Constraint Audit

*The following checks the live schema:*

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles';
```

### Required Result:

| Column   | Type  | Null | PK  |
|----------|-------|------|-----|
| id       | uuid  | no   | yes |
| email    | text  | no   |     |
| role     | text  | no   |     |

- **id** is `uuid`, not `text` (checked by repair SQL and confirmed for this environment).
- **email** and **role** are `text NOT NULL`.
- There are **no extra triggers** (see: auto_repair_profiles.sql, clean).

---

## 5. Triggers/Legacy Audit

*Triggers:*
```sql
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles';
```
> Should be **no rows**.

---

## 6. Root Cause Diagnosis and Remediation

Based on all attached error logs, payloads, session context, and live project config, **the most likely causes if you still see the error are:**
1. **A legacy/conflicting RLS policy still exists on the 'profiles' table**—run the auto_repair_profiles.sql fix again.
2. **Migration from TEXT to UUID for id incomplete**—if any row has a broken text value in id, upsert will silently fail RLS (type collision).
3. **A hidden trigger or NOT NULL constraint blocks upsert**—audit with included scripts, but none should be present if SQL repair was run.
4. **Browser session context became corrupted**—force logout, clear cookies/localstorage, and repeat from a clean login.
5. **Upsert attempted with no session/auth context**—see code, which defensively blocks this, but always validate with `.getSession()` before upserts.

### Recommended Fix & Verification Steps

1. Re-run `assets/auto_repair_profiles.sql` in the Supabase SQL editor to guarantee there is **only the correct upsert RLS policy** (drops legacy, sets required).
2. Confirm table schema is `id (uuid)`, `email`, `role` (all NOT NULL).
3. Ensure frontend uses only anon/public key (see above).
4. Use the following SQL to verify live policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'profiles';
   ```
   There **must be only one** policy, as shown under "Expected Policy."
5. Test upsert in incognito/private window with new registered user.

---

**If still blocked after these steps**, fully drop all RLS policies for `profiles` and re-apply ONLY the above, and re-run the column definitions to ensure `id` is a UUID everywhere.  

For advanced audit, also see:
- `assets/supabase_applied_rls.sql`
- `assets/supabase_rls_runtime_diagnosis.sql`
- `assets/upsert_rls_diagnostics.md`

---

_Last update: RLS/Upsert Diagnostics, full session match case_

