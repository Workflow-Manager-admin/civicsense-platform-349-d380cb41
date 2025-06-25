# Supabase Integration & Diagnosis Log

## 📣 Run the following SQL in Supabase SQL Editor to allow authenticated users to insert or update *only their own* profile row:

```sql
-- 1. Make sure RLS is ON
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Remove any prior conflicting policies
DROP POLICY IF EXISTS "Users can insert or update their own profile" ON profiles;

-- 3. Create policy for insert/update (ID = auth.uid())
CREATE POLICY "Users can insert or update their own profile"
  ON profiles FOR INSERT, UPDATE
  USING (auth.uid() = id);
```

> **Instructions:**
> - Paste and run this SQL in your Supabase project's SQL Editor.
> - This ensures that only a user with a valid session can insert or update their own profile row (`id` should be `auth.uid()`).
> - For table structure: ensure `id` is `NOT NULL` and unique, and fields `email` and `role` exist and are `NOT NULL`.
> - Remove other policies covering profiles INSERT/UPDATE that may conflict with or override this rule.

---

### Troubleshooting Checklist for Profile Upsert RLS Errors

- User session/auth must be valid (`auth.uid()` present).
- Always upsert profile with: `id` (auth.uid()), `email`, and `role`.
- Only the above RLS policy should be enabled for INSERT/UPDATE.
- Check for unique indexes: `id` and `email`.

---

_Last update: RLS policy clarified and ready for copy-paste SQL execution._
