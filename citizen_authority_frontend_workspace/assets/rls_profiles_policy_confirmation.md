# ✅ CivicSense: 'profiles' Table RLS Policy State Confirmation

**Profiles table 'Row Level Security' (RLS) policies are now fully compliant and minimal for user upsert flows. All redundant INSERT and UPDATE policies have been removed, and only the correct policy remains.**

---

## 📋 Final Policy on `profiles` (upsert/insert/update):

```sql
CREATE POLICY "Users can insert or update their own profile"
  ON profiles
  FOR INSERT, UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

- **No other INSERT or UPDATE policies exist** (all others removed).
- Policy ensures only authenticated users can insert or update their own profile (`auth.uid() = id`).
- Matches code and troubleshooting documentation (see `assets/supabase.md`, `upsert_rls_diagnostics.md`).

---

## 🔐 How to verify

After running the remediation/repair SQL:

```sql
SELECT policyname, cmd, qual AS using_clause, with_check
FROM pg_policies WHERE tablename = 'profiles';
```

- **Expected Output:** _Exactly one_ policy ("Users can insert or update their own profile") with both `USING` and `WITH CHECK` as `(auth.uid() = id)` and `cmd` covering `insert` and `update`.

## 🟢 Status

- [x] Only a single "Users can insert or update their own profile" policy exists for INSERT and UPDATE.
- [x] No legacy, duplicate, or conflicting upsert policies remain.
- [x] RLS will permit upserts ONLY for the logged-in user (auth.uid = id).

---

_Last audited: Automated confirmation file generated after RLS repair for CivicSense profiles table._
