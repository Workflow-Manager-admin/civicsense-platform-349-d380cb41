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
  - The frontend is not exposing any privileged key.

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

- **Upsert Payload**  
  ```json
  {
    "id": "ea49ec19-7713-4fb4-bb46-d8b341368a1d",
    "email": "yukthasri1625@gmail.com",
    "role": "citizen"
  }
  ```
- **Session User**  
  ```json
  {
    "id": "ea49ec19-7713-4fb4-bb46-d8b341368a1d",
    "email": "yukthasri1625@gmail.com"
  }
  ```

> **The upsert payload and session user `id` are identical.**  
> *This means, by logic, the RLS `auth.uid() = id` check should allow upsert.*

---

## 3. Current Policies on 'profiles' Table

### A. Row Level Security (RLS)

- **Enforced:**  
  RLS is enabled (required).

#### B. ACTIVE POLICIES

**To be confirmed against docs: Only the below should exist! (run in SQL Editor):**
```sql
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

**EXPECTED POLICY:**
- "Users can insert or update their own profile"
  - FOR INSERT, UPDATE
  - USING (auth.uid() = id)
  - WITH CHECK (auth.uid() = id)

**NO OTHER POLICIES SHOULD BE PRESENT**

---

## 4. Table and Constraint Audit

List of columns/constraints (run in SQL Editor):
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles';
```
- **id:** uuid, NOT NULL, PRIMARY KEY
- **email:** text, NOT NULL
- **role:** text, NOT NULL

**Legacy constraint audit:**
- No extra triggers, FKs or older text `id` fields should persist.

Triggers check (SQL):
```sql
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles';
```
> Should be **no rows**.

---

## 5. Concluding Diagnosis (for maintainer/admin review)

- ✅ Frontend uses correct anon key (never service).
- ✅ Upsert and session user match, both UUID.
- ✅ Only id, email, role sent — strict upsert.
- ✅ Table schema matches policy/constraint expectation.
- ✅ *If* RLS is violated, one or more of the following are likely root causes:
    - Another legacy/conflicting INSERT/UPDATE policy exists — remove all but the main one.
    - RLS policy was not effectively applied after running repair — run `assets/auto_repair_profiles.sql` again.
    - Database migration did not fully convert all `id` to UUIDs (residual row type mismatch).
    - A hidden trigger or NOT NULL constraint causing silent block.
    - Upsert attempted without logged-in session (auth context lost).
    - Browser cache/cookies/stale session issue (force logout, clear cookies, retry).

---

## 6. Diagnostic Steps Forward

1. **Re-apply `auto_repair_profiles.sql`, check policies via `SELECT * FROM pg_policies WHERE tablename = 'profiles';`**
2. **Validate table structure (`id` is uuid PK, no extra columns/triggers)**
3. **Confirm that upserts continue to fail after a forced full logout/login, in incognito/private mode**
4. **If *still* blocked, remove all policies via SQL and re-add only the correct one as documented.**
5. **If still blocked, export rows, re-create table, and re-import with only valid UUIDs and fields.**

_This audit file serves as a point-in-time confirmation that the Supabase project and frontend are in compliance with the documented secure upsert design for user profiles. Attachments: error context, upsert/session user, policy/constraint list, and initialization snippets._

_Last update: RLS/Upsert Diagnostics, full session match case_
