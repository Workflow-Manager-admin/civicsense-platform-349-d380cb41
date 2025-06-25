# Profile Upsert & RLS Diagnostics – Citizen & Authority Frontend

## 🔎 Overview
Collected here are the relevant code snippets and diagnostics for profile upsert logic, request payloads, session info at upsert, and table column/policy alignment for citizen and authority login/signup flows. Use this info to audit for mismatches leading to persistent RLS violation errors.

---

## 1. Supabase Client Initialization
**File:** `src/supabase/supabaseClient.js`
```js
const supabaseUrl = 'https://kwznqztqlvkeoxjzlhkm.supabase.co';
const supabaseKey = 'eyJhbGciO...'; // anon/public key ONLY

export const supabase = createClient(supabaseUrl, supabaseKey);
// NOTE: Always use anon/public key here. 'id' = user.id required for 'profiles' upserts.
```

---

## 2. Profile Upsert on Citizen Signup
**File:** `src/pages/SignupCitizenPage.jsx`
### Payload and logic:
```js
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
### Session context at upsert:
```js
const sessRes = await supabase.auth.getSession();
const sessionUser = sessRes?.data?.session?.user;
// Defensive: only upsert if (sessionUser && sessionUser.id === user.id)
```
- **Confirms session is valid and matches user.id before upsert.**

---

## 3. Profile Upsert on Citizen Login
**File:** `src/pages/LoginCitizenPage.jsx`
### Upsert path for missing profile:
```js
const upsertData = { id: user.id, email: user.email, role: 'citizen' };
let upsertRes = await supabase
  .from('profiles')
  .upsert(
    [upsertData],
    { onConflict: ['id'], returning: 'representation', ignoreDuplicates: false }
  )
  .select('id,email,role');
// Diagnostics output for error/success, payload, and session user
```
### Session context check:
```js
const sessRes = await supabase.auth.getSession();
const sessionUser = sessRes?.data?.session?.user; // Must match user.id!
```
- **Checks: Do not upsert if session is not live or doesn't match `user.id`**

---

## 4. Authority Login Insert (Not "upsert", but similar logic)
**File:** `src/pages/LoginAuthorityPage.jsx`
```js
const payload = { id: user.id, email: user.email, role: 'authority' };
const { error: insertProfileError } = await supabase.from('profiles').insert([
  payload
]);
if (insertProfileError) {
  setError('Could not create authority profile: ' + insertProfileError.message
    + "\\nDiagnostics: sessionUser=" + JSON.stringify(sessionUser)
    + ", user=" + JSON.stringify(user) + ", payload=" + JSON.stringify(payload));
}
```
### Session diagnostics:
- Logs both `user` and `sessionUser` for insert attempts.

---

## 5. Confirmed Payload for Upsert/Insert

**All upserts and inserts into `profiles` table consistently use:**
```js
{
  id: user.id,      // supplied from Auth session (should match auth.uid() in RLS)
  email: user.email,
  role: 'citizen'   // or 'authority'
}
```
- The **id** is always the authenticated user's id from Supabase Auth. It **must** match `auth.uid()` to pass the RLS policy.

**Table columns expected (from supplied SQL & diagnostics):**
- `id`: TEXT, PRIMARY KEY, NOT NULL
- `email`: TEXT, NOT NULL
- `role`: TEXT, NOT NULL

---

## 6. RLS Policy (from supabase.md and supabase_applied_rls.sql)

The only correct policy should be:
```sql
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

---

## 7. DIAGNOSTIC CHECKLIST

From **assets/supabase.md** and in-code diagnostics:
- **Session context**: Always checked (`sessionUser.id === user.id`)
- **Payload matches schema**: `{id, email, role}` only
- **Table columns**: match upsert payload
- **RLS policy**: should be ONLY `(auth.uid() = id)` for both USING and WITH CHECK

---

## 8. Example Diagnostic Console Output for Failure
From upsert error handling in both login and signup:
```
Failed to upsert citizen profile: <error message>
... (See assets/supabase.md for RLS upsert troubleshooting.)
SessionUser: <session user object>
User: <user object>
Upsert payload: { id: ..., email: ..., role: 'citizen' }
Latest RLS policy: USING (auth.uid() = id) WITH CHECK (auth.uid() = id).
```

---

## 9. **NO usage of extra or missing columns in upsert/insert.**  
All upserts are strictly `{id, email, role}`.

---

# ✅ Conclusion:  
- The frontend upsert payload, session context, and column names **exactly** match both Supabase table schema and RLS policy expectations.
- Persistent RLS errors must be due to:
  - Broken Auth/session (not logged-in)
  - id value mismatch (payload id ≠ session user id, or session missing)
  - Client using wrong project/key/URL in supabaseClient.js
  - RLS policy not present or still has legacy/conflicting policies (as described in assets/supabase.md)
  - Database columns diverge from `{id, email, role}` (unlikely if managed)

Refer to this document and assets/supabase.md for root cause debugging with full visibility.

