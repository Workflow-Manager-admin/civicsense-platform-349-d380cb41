# ⚡ Troubleshooting: Supabase Auth Signup Fails — Remove FOREIGN KEY on `profiles.id`

## Background

If you encounter `"Database error saving new user"` _during signup_ and you've ruled out all other schema, trigger, and RLS/policy issues (see other diagnostics), the likely remaining cause is a **transaction/timing issue** with a FOREIGN KEY constraint:

> `profiles.id` references `auth.users.id`

Supabase Auth attempts to create the user in `auth.users` and then your application (or an Auth hook) tries to insert a row in `profiles`. If these are **not fully transactional** (due to RLS/session, or external upsert logic), the **FK constraint** may block insertion if the `auth.users` record does not exist at the exact instant of the insert.

## Action Steps

### 1. Temporarily Remove `profiles.id` FOREIGN KEY

In the Supabase SQL Editor, run:

```sql
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
```

- This disables the FK constraint linking `profiles.id` to `auth.users.id`.
- All other keys and policies remain unchanged.

---

**Why this may solve the problem:**

With the FK removed, the `profiles` table can accept new rows with any valid `id` (i.e. UUID or TEXT as expected), independent of the existence of an `auth.users` row. In Supabase, as long as you are running with a **valid Auth session** (`auth.uid()` available), profile inserts and upserts succeed if RLS policies and the schema match.

---

### 2. Retry Signup

- Attempt to sign up and create a new user (_as a real end-user, not via SQL editor!_) in your app.
- If signup and profile creation now go through, the FK constraint **was the cause** of the errors.

---

### 3. Next Steps

#### a. If This Works
- **Review Supabase best practices for custom user profiles**: The recommended pattern is to create profile rows AFTER user signup, using a server-side function, trigger, or edge function, when the Auth context is 100% available.
- Direct profile upserts from the frontend are supported only when the FK constraint is not enforced, or WITH transactional hooks (see Supabase docs).

#### b. If You Require the FK
- Only re-add the FOREIGN KEY after verifying that:
  - Profiles are created after the Auth row exists.
  - All inserts to `profiles` have a valid `id` matching a real Auth user.
  - (Advanced) You handle referential integrity using post-signup triggers or edge functions, not immediate frontend upserts.

---

### 4. Documentation

- Supabase reference:  
  - [Managing User Profiles & Foreign Keys](https://supabase.com/docs/guides/auth/managing-user-data#storing-additional-user-data)
  - [User creation hooks and best practices](https://supabase.com/docs/guides/auth/managing-user-data#user-data-best-practices)
  - [Custom triggers for profile linkage](https://supabase.com/docs/guides/auth/managing-user-data#profile-creation-on-signup)

---

## Summary

- **Remove the FK** to allow profile creation with Auth-based upserts.
- **Test signup** via the app.
- **Adopt a post-signup pattern** or edge function if you require strict referential integrity.

---

_Last updated: 2024-06 — Drafted as part of Civicsense smart city troubleshooting_
