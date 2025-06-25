# Supabase Auth Email Confirmation Delivery Troubleshooting — CivicSense Platform

_Last updated: 2024-06_

## 📨 Issue: Email Confirmation Link Not Received

If users are not receiving email confirmation links from Supabase Auth after signup, review this checklist to quickly diagnose and resolve.

---

## 1. 📋 Check Auth Email Configuration in Supabase

- Visit your Supabase dashboard.
- Go to: **Authentication** → **Settings** → **Email**
- By default (Free/Pro tier), Supabase uses an internal SendGrid account to send auth emails.

### ✅ Are the "Auth Emails" toggle(s) enabled?
- Confirm that **"Enable Confirmations"** is ON.
- Are **Magic Link**, **Password Recovery**, and other required options enabled as needed?

### Advanced: Custom SMTP
- If you configured a custom SMTP server, double-check credentials, host, and port.
- [Supabase Email Docs](https://supabase.com/docs/guides/auth/auth-email)

---

## 2. 📬 Spam Folder and Email Filtering

- Supabase free tier (default SendGrid) often results in **delivery to spam/junk folders**, especially for test accounts and non-work emails (Gmail, Outlook, Yahoo).
- Gmail may "bounce" or block these on first send.
- **Action**: Ask users to check *all inboxes, spam, promotions, and social folders*.

---

## 3. 🛡️ Sending Domains and Rate Limits

- Supabase’ internal SendGrid on free tier is rate-limited and uses generic shared IPs/domains.
- Occasionally, emails are rejected by recipient mail providers.
- **Temporary workaround** for DEV:
    - Use a different test email/provider (e.g. protonmail, outlook, fastmail, custom domains, not just Gmail/Yahoo).
    - Add your custom domain and set up DKIM/SPF if planning custom SMTP (Pro-tier and up).

---

## 4. 🪵 Check the Supabase Auth Logs

- In Supabase dashboard: **Authentication → Logs**
- Filter for `"email"` to see if the confirmation was sent.
- **If there are errors:** View the error detail to inspect misconfiguration or rejections.
- You can *re-send* confirmation emails from the Auth dashboard by selecting a pending user.

---

## 5. 🚧 DEV/QA Workaround: Temporarily Disable Email Confirmation

For easier dev/test flows (not recommended for prod):

1. In dashboard, go to: **Authentication → Settings → Email Auth**
2. **Disable "Email Confirmations"** (toggle OFF).
3. All signups become instantly active and won’t require confirmation.
4. **DO NOT** use this in production for real users.

---

## 6. 🔁 Retrying & Testing Advice

- Signing up with the exact same email may not re-trigger confirmation for some providers.
    - Instead, add “+test” or use a different test address (e.g., user+2@domain.com).
- Wait a minute; some mail providers delay delivery for bulk/suspicious emails.
- Resend via dashboard for unconfirmed users.

---

## 7. 🟡 Known Supabase SendGrid Issues

- Deliverability problems most common on free tier.
- *Custom SMTP is supported* from Project Settings for paid plans.
- If critical, upgrade and configure your own sender identity and records for best results.

---

## 8. 🔍 Diagnostic Checklist (Quick)

| Step         | Description                                                   |
|--------------|---------------------------------------------------------------|
| Settings     | Confirm email confirmations are enabled in Auth Settings      |
| Logs         | Check Supabase Auth logs for "sent" or error                  |
| Spam         | Double-check spam/junk folders and promotions tabs            |
| Email        | Try alternate (non-Gmail/Yahoo) addresses if possible         |
| Dev Toggle   | For quick QA, disable “Email Confirmations” temporarily       |
| SMTP         | Check custom SMTP config if set (not default on free tier)    |
| Dashboard    | Resend link to user via dashboard/manual                      |
| Delay        | Wait up to 5 minutes for delays or throttled sendgrid queues  |

---

## 9. ❌ Still Not Working?

- Provide a copy of the **Auth log entry**, the **test email address** not receiving, and the project region and name.
- Consider manually verifying user via dashboard for urgent dev/test unblock.
- If using your own SMTP: use [mail-tester.com](https://www.mail-tester.com/) to check your setup.

---

## 10. ⚡ CivicSense Platform: Project-Specific Recommendations

- On *early development*, disable confirmations to ensure fast QA/testing (re-enable for production!).
- For frontend, always display a message after signup:  
  > "Signup successful! Please check your email and confirm your account before logging in."
- Backend profile upserts *must not* run until confirmation and login complete (RLS will block otherwise).

--- 

_This document is included by default as `assets/supabase_auth_email_troubleshooting.md`  
For more details, see also `supabase_auth_email_confirmation_guide.md` in the same folder._

