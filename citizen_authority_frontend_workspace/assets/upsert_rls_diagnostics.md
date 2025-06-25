# Profile Upsert & RLS Diagnostics – Citizen & Authority Frontend

## 🔎 Overview
This document provides a full diagnostic summary for profile upserts involving Supabase RLS on the `profiles` table from the **citizen and authority signup/login flows**. It covers exact code snippets, request payloads, active session context, table/schema/policy checks, and diagnostic guidance for persistent RLS errors.

---

## 1. Supabase Profile Upsert — Code Snippets

### **A. Citizen Signup (`SignupCitizenPage.jsx`):**
```js
// Defensive: Only do upsert if session is fully valid and user.id present
const sessRes = await supabase.auth.getSession();
const sessionUser = sessRes?.data?.session?.user;

// Defensive upsert - always supply all required fields
const upsertPayload = { id: user.id, email: user.email, role: 'citizen' };
let upsertRes = await supabase
  .from('profiles')
  .upsert(
    [upsertPayload],
    { onConflict: ['id'], returning: 'representation', ignoreDuplicates: false }
  )
  .select('id,email,role');
let profileError = upsertRes.error;

if (upsertRes?.data) {
  console.log("[DIAG] SignupCitizenPage: Upsert returned data:", upsertRes.data);
}
if (profileError) {
  console.error("[DIAG] SignupCitizenPage: Upsert failed with error:", profileError, "Payload:", upsertPayload);
}
```
- Session check: only attempt upsert if `sessionUser` exists and `sessionUser.id === user.id` (user from signup response).

---

### **B. Citizen Login (`LoginCitizenPage.jsx`):**
```js
const sessRes = await supabase.auth.getSession();
const sessionUser = sessRes?.data?.session?.user;
if (!sessionUser || sessionUser.id !== user.id) {
  setError("User session not fully established...");
  return;
}
const upsertData = { id: user.id, email: user.email, role: 'citizen' };
let upsertRes = await supabase
  .from('profiles')
  .upsert(
    [upsertData],
    { onConflict: ['id'], returning: 'representation', ignoreDuplicates: false }
  )
  .select('id,email,role');
let upsertError = upsertRes.error;

// Diagnostic logs:
if (upsertRes?.data) { console.log("[DIAG] Upsert returned data:", upsertRes.data); }
if (upsertError) { console.error("[DIAG] Upsert failed with error:", upsertError, "Payload:", upsertData); }
```
- Upsert only occurs if session is valid and matches user, with strong diagnostic logging.

---

### **C. Authority Login (`LoginAuthorityPage.jsx`):**
```js
// Only if authority profile is missing
const sessRes = await supabase.auth.getSession();
const sessionUser = sessRes?.data?.session?.user;
const payload = { id: user.id, email: user.email, role: 'authority' };
// Diagnostics shown for both user and session user
const { error: insertProfileError } = await supabase.from('profiles').insert([payload]);
if (insertProfileError) {
  setError('Could not create authority profile: ' + insertProfileError.message
    + "\nDiagnostics: sessionUser=" + JSON.stringify(sessionUser)
    + ", user=" + JSON.stringify(user) + ", payload=" + JSON.stringify(payload));
}
```
- Authority version uses `.insert` not upsert, but session/user/payload diagnostics are equivalent.

---

## 2. Upsert/Insert Payload and Session Context

**All upserts/inserts use:**
```js
{
  id: user.id,      // from Supabase Auth (must match auth.uid() for RLS)
  email: user.email,
  role: 'citizen'   // or 'authority'
}
```
- **Session context**: Always checked with `getSession()` before upsert/insert. Upsert/insert is NOT performed unless `sessionUser.id === user.id`.

---

## 3. RLS Policy & Table Structure Reference

### **RLS Policy (in assets/supabase.md, supabase_applied_rls.sql):**
```sql
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```
- **No other conflicting insert/update policies** should be present.

### **Table (expected columns/types):**
- `id`: TEXT, PRIMARY KEY (NOT NULL)
- `email`: TEXT (NOT NULL)
- `role`: TEXT (NOT NULL)

---

## 4. Diagnostic Checklist — Common Sources of RLS Failure

| Checkpoint                  | Should Be...                                                             | Confirmed in Code?          |
|-----------------------------|--------------------------------------------------------------------------|-----------------------------|
| Session & Auth              | Session exists; user is logged in at upsert                              | ✅ Yes (checked each time)   |
| Payload Completeness        | `{ id: user.id, email, role }` — id matches auth.uid()                   | ✅ Yes                      |
| Upsert Fields/Types         | Only `id`, `email`, `role` (text values)                                 | ✅ Yes                      |
| RLS Policy                  | `(auth.uid() = id)` for both USING and WITH CHECK                        | ✅ Yes in SQL                |
| Table Schema                | `id`, `email`, `role` as NOT NULL                                        | ✅ Yes                       |
| No Extra/Missing Columns    | No additional columns in upsert payload                                  | ✅ Yes (see code)            |
| No Legacy Policies          | No other insert/update policies with conflicting logic                    | ⚠️ Must be checked in DB     |
| Supabase Client Project     | Uses proper URL and anon key                                             | ✅ Yes (see supabaseClient.js)|
| Accept Header               | Defaults to JSON with supabase-js (not typically an issue in v2+)        | ✅ Yes                       |

---

## 5. Example Diagnostic Console Output for Failures

```
[DIAG] Upsert failed with error: {message, code, ...} Payload: { id: ..., email: ..., role: ... }
SessionUser from getSession(): {id: ...}
User: {id: ...}
Upsert payload: {id: ..., email: ..., role: ...}
Latest RLS policy: USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
```
- Error details, session/user ids, and payload logged.
- 403/406 errors will include RLS troubleshooting pointers.

---

## 6. Annotated Manual/Code Fix Guidance

### **A. If You Still See "RLS Violates Policy" Errors:**

1. **Confirm User Is Logged In:**
   - All upserts/inserts will fail RLS if there is no authenticated user/session. Login is always required.

2. **Ensure Upsert/Insert Payload Includes:**
   - `id: user.id` from the session (auth.uid()),
   - `email` and `role` are present (text, not null).

3. **Check RLS Policy in Supabase SQL:**
   - Must have *only*:
     ```
     CREATE POLICY "Users can insert or update their own profile"
       ON profiles
       FOR INSERT, UPDATE
       USING (auth.uid() = id)
       WITH CHECK (auth.uid() = id);
     ```
   - Drop all legacy/conflicting insert/update policies.

4. **Confirm Table Schema Matches:**
   - Table must have `id`, `email`, `role` (all TEXT, NOT NULL, with `id` as PK).

5. **Diagnose the Session ID Mismatch:**
   - If `id` in payload ≠ `sessionUser.id`, RLS will always reject.
   - Diagnostic console logs reveal this clearly.

6. **Check Project URL/Key in supabaseClient.js:**
   - Client initialization must be to the correct Supabase project and use the *anon* (not service role) key.

7. **No Extra/Missing Columns:**
   - Do not add columns to the upsert payload or omit required ones.

8. **Test in SQL Editor (as Authenticated User):**
   - Try an upsert in SQL using `auth.uid()` to confirm policy behavior.

---

## 7. Quick Troubleshooting Script

- Run in Supabase SQL Editor to see policies:
  ```sql
  SELECT * FROM pg_policies WHERE tablename = 'profiles';
  ```
  - There should be *only* the "Users can insert or update their own profile" policy for inserts and updates.

---

## 8. FULL PHYSICAL TABLE SCHEMA AUDIT & REPAIR IF 500 ERROR PERSISTS

If all policies are correct but you get a persistent 500 Internal Server Error during signup/upsert:

**A. Check Profiles Table Structure for Hidden Mistakes**

Run this SQL in Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles';
```
- Confirm:
  - `id` is **uuid** or **text** (if legacy, must exactly match type, and NOT NULL, *must* match type used by Auth user).
  - `email` and `role` are **text NOT NULL**
  - No columns have a **default** that could cause a constraint failure.

**B. Check for Triggers (should be NONE):**
```sql
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles';
```
- No results should be returned.

**C. Check for Constraint Failures:**
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass;
```
- Only PRIMARY KEY on "id" should be present.

**D. Verify With a Raw Upsert as Authenticated User**

In SQL Playground, logged in as an Authenticated user, try:
```sql
insert into profiles (id, email, role) 
values (auth.uid(), 'testuser@example.com', 'citizen')
on conflict (id) do update set email=excluded.email, role=excluded.role
returning *, auth.uid() as runtime_uid;
```
- If this fails, error will reveal type/constraint/policy problem.
- If "runtime_uid" is NULL, check Auth context.

**E. If "id" type mismatch or legacy data prevents ALTER:**
  - You must manually migrate or delete legacy records with bad types.
  - Example repair (for UUID):
    1. Backup the broken data.
    2. Drop/recreate table with proper `id uuid PRIMARY KEY NOT NULL, email text NOT NULL, role text NOT NULL`.
    3. Rerun policy as described.

**F. More Help**
- See [`assets/auto_repair_profiles.sql`](./auto_repair_profiles.sql) for correct structure and one-shot redo.

---

## 8. Summary Conclusion

- All current upsert/insert code for citizen/authority flows *conforms* to required session, payload, table, and policy expectations.
- If RLS is *still* violated:
  1. Confirm you have logged in (session/user present).
  2. Confirm upsert payload structure.
  3. Double-check Supabase project settings and table policy removal of legacy/old rules.
  4. Use diagnostic output in logs/UI to cross-verify user id and payload content at insert time.
  5. Review [assets/supabase.md](./supabase.md) for updated policy and troubleshooting.

---

_Last update: Full diagnostic collected from React sources and Supabase troubleshooting docs for RLS profile upserts._
