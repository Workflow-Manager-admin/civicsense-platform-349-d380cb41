# Supabase Auth Email Confirmation & "Session Not Active" Signup Error – CivicSense

## ❓ Why does this happen?

By default, **Supabase Auth requires new users to confirm their email address** before their session is considered active.
- Until the user clicks the confirmation link in their inbox, they are **NOT** able to log in or perform authentication-required actions (like upserting a profile row with RLS).
- Code that tries to access `auth.uid()`, or do authenticated Supabase actions immediately after signup (without confirmation), **WILL FAIL** with errors like:

```
Session not active. Please confirm your email, then log in.
```

## 🔒 Should we change this?

For **PRODUCTION**:  
- Keep email confirmation **ENABLED** as it's important for security and user legitimacy.

For **DEVELOPMENT/QA**:  
- You can **disable email confirmation** temporarily for faster testing (see below).
- Alternatively, improve the frontend UX/message to clarify that a confirmation email is required and no backend profile operation will succeed until logged in post-confirmation.

## ⚡ How to disable email confirmation (TEMPORARY/DEV ONLY):

1. Sign in to your Supabase project dashboard.
2. Go to: **Authentication** → **Settings** → **Email Auth**.
3. Disable the "Email Confirmations" toggle.
4. Now, signups will result in an instantly active user session (✅), so profile upserts on signup will succeed.

**Do not keep this disabled in production!**

## 👩‍💻 Frontend/UX Guidance

- After signup, if no session is present or you see "Session not active...", display a message:  
  > "Signup successful! Please check your email and confirm your account before logging in."
- Do not attempt to upsert the `profiles` row until the user has logged in after email confirmation.

## 🛠️ For advanced users: (Edge Functions/hooks)

- For production projects requiring custom logic, consider using Supabase Auth Hooks or Edge Functions to automate profile row creation upon confirmed signup. See: https://supabase.com/docs/guides/auth/auth-helpers/edge-functions

---

_Last updated: 2024-06. This file should be used to guide all devs/QA facing authentication or “session not active” issues in CivicSense or any Supabase-auth project._
