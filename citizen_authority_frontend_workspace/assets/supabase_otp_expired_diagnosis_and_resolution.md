# Supabase Auth Email "otp_expired" Error — Diagnosis & Resolution Plan

_Last updated: 2024-06, for CivicSense Platform_

## 🚨 Problem: 'Email link is invalid or has expired' / `otp_expired` on Email Confirmation

Users receive a 403 error (`{"code":403,"error_code":"otp_expired","msg":"Email link is invalid or has expired"}`) when clicking a confirmation link for signup. This usually means:

- **The user tried to use an expired or already-used link**
- **Email delivery was delayed** (by spam filtering, delayed SMTP, etc.)
- **The expiration window for the link is too short** for the email to arrive in time
- **Server time skew** or configuration issue in the Supabase or SMTP setup

---

## 🔍 Diagnosis Checklist

Follow these steps to identify and resolve the cause:

### 1. **Email Confirmation Settings (Expiration Window)**
- By default, Supabase sets the expiration for confirmation emails (OTP/magic link) to **1 hour** (3600 seconds).
- On **Free/Pro tier**, this value is not *directly customizable* from dashboard UI (as of June 2024).
  - For custom SMTP (Pro/E, or self-host), it may be possible to adjust with [Supabase Auth Edge Functions](https://supabase.com/docs/guides/auth/auth-hooks/edge-functions).
- **Check your expiration value:**
  - In the dashboard: *Authentication → Settings → Email Auth*.
  - (If the field exists) Set **"Expiry time"** (in seconds) to a higher value (3600–10800 recommended).

### 2. **Email Delivery Time**
- Delays can easily exceed 1–5 minutes for:
    - Gmail, Outlook, Yahoo, Protonmail (esp. free-tier Supabase SendGrid)
    - Spam/junk folder checks and anti-spam holdups
- **Typical causes:** 
    - Shared IP sender throttling (default SendGrid)
    - Message not delivered before expiry
    - Delivering to unused/test accounts with slow inbound

#### Steps:
- **Use a fast provider** for test (work email, Outlook Exchange, custom domain, etc.).
- **Check user spam/junk folders**.
- **Resend confirmation link** via Supabase dashboard (Authentication → Users → Resend email).

### 3. **Ability to Customize Expiry Window**
- **Free tier:** No out-of-the-box support for increasing expiry beyond default in dashboard.
- **Workaround:** For urgent dev/test, temporarily **disable "Email Confirmation Required"**:
  - Dashboard: *Authentication → Settings → Email Auth* → "Email confirmations" OFF.
  - WARNING: *Do not use in production!*
- **Production:** Contact Supabase support for increasing expiry if custom SMTP is not available.
- For advanced control (Pro/E plans):
  - Use Edge Functions to set OTP lifespan for confirmation flows via `nextauth.js` or use [custom email sending](https://supabase.com/docs/guides/auth/email-auth#customizing-email-templates--expiration).

### 4. **Testing With New Confirmation**
- **Do NOT reuse already-clicked links**—Supabase invalidates them after first use.
- Sign up with a *brand new* email or use aliasing (e.g. `user+test2@gmail.com`) to trigger a new email.
- Alternatively, resend from dashboard for *pending confirmation* users.

### 5. **Review Auth Logs**
- In dashboard: *Authentication → Logs*.
- Filter for `"email"` to check if:
  - Email was sent
  - There are errors ("Delayed", "Bounced", etc.)
- If available, check for `"Expired"` or `"Used"` logs for the OTP.

### 6. **Check Server & Project Time Sync**
- Supabase-managed: Time is always UTC, synced on the cloud.
- For **self-hosted**: Ensure server time is synchronized (NTP).
- No action needed for standard hosted projects.

### 7. **Try Alternative Email Providers**
- For dev/test, use a different email that reliably gets mail (avoid Gmail during heavy testing).
- *Mail-tester.com* is useful for diagnosis.

---

## ✅ Steps to Resolve / Mitigate

### a. **For Immediate Dev/Test Unblock**
1. **Temporarily disable email confirmations:**
   - Dashboard → Auth → Settings → Email Auth → **"Email Confirmations" OFF**
   - All signups will be instantly confirmed and session active.
   - **Re-enable in production!**

2. **Advise users to check all spam/junk folders** and only click the latest link.

3. **Test with multiple providers** if email is slow or missing.

### b. **If You Control SMTP/Edge Functions (Pro/Enterprise)**
- Adjust expiry window programmatically if possible (*requires custom SMTP & Edge Auth*).
- See [Supabase Auth Edge Functions: Customizing email OTP expiry](https://supabase.com/docs/guides/auth/auth-hooks/edge-functions)

### c. **For Production/Long-term**
- Raise a ticket with Supabase Support if you get frequent `otp_expired` despite immediate signup & clicks.
- Consider upgrading and switching to custom SMTP for better deliverability.
- *User education:* Alert users that "Confirmation links expire fast, please check your inbox and click as soon as possible."

---

## 📝 CivicSense Platform — Summary

- Default expiry is **1 hour (not user-settable on Free tier)**
- Slow/blocked email delivery is usually the cause, not app code
- Disable "require confirmation" for DEV only (see detailed guide in `assets/supabase_auth_email_confirmation_guide.md`, `assets/supabase_auth_email_troubleshooting.md`)
- Always advise users to check spam and click the **latest** link
- If errors persist: review logs, test with alternative email, and raise with Supabase if needed

---

### Key References

- [`assets/supabase_auth_email_confirmation_guide.md`](./supabase_auth_email_confirmation_guide.md)
- [`assets/supabase_auth_email_troubleshooting.md`](./supabase_auth_email_troubleshooting.md)

---

## 📋 Quick Actions Checklist

| Step                             | Description                                                      | Guide/Doc                                   |
|----------------------------------|------------------------------------------------------------------|---------------------------------------------|
| Check expiry/confirmation toggle | Dashboard > Auth > Settings > Email Auth                         | See above                                   |
| Try faster email/provider        | Use Outlook/fastmail or custom SMTP                              | See above                                   |
| Advise user on link use          | Only the *latest* link is valid; check spam/junk                 | -                                           |
| Resend confirmation manually     | Supabase dashboard > authentication > users > resend confirmation | -                                           |
| For DEV: disable confirmation    | Only for tests, see linked assets docs                           | `assets/supabase_auth_email_confirmation_guide.md` |
| Raise issue with Supabase        | Frequent 'otp_expired' even when links are fresh                 | [Supabase Support](https://supabase.com/docs/support) |

---

_This document is the official CivicSense troubleshooting plan for Supabase email OTP expiration/confirmation issues. For updates or support, see linked assets or [Supabase documentation](https://supabase.com/docs/guides/auth/email-auth#magic-links-expiration)._ 
