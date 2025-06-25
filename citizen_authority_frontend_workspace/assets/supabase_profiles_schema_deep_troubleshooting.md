# 🚨 Supabase 500 Error on Signup/Upsert: Deep Schema Troubleshooting Guide

If you encounter a persistent `500 Internal Server Error` or "database error saving new user" during signup/upsert, **after having already resolved RLS policy issues**, follow the precise checklist below. This guide is a distilled version of advanced diagnostics derived from codebase, SQL, and platform expectation.

---

## 1. **Check Table Columns (Type/Nullability/Mismatch)**

Run:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'profiles';
```
- `id` column must be **uuid** (or perfectly matching text), and **NOT NULL**
- `email`, `role`: text, **NOT NULL**
- No "default" values that could break INSERT

---

## 2. **Check Constraints (PK/Uniqueness/Legacy Problems)**

Run:
```sql
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass;
```
- Expect: Only one PK (`PRIMARY KEY (id)`)
- No other FKs or uniqueness constraints on unexpected columns

---

## 3. **Check for Triggers (Must Be None!)**

Run:
```sql
SELECT trigger_name FROM information_schema.triggers WHERE event_object_table = 'profiles';
```
- **Result must be empty.** Any result = breakage. Remove as shown in `auto_repair_profiles.sql`.

---

## 4. **Test Direct Upsert (Authenticated User)**

In SQL playground **as a logged-in user**, not service role:
```sql
insert into profiles (id, email, role)
values (auth.uid(), 'testuser@example.com', 'citizen')
on conflict (id) do update set email=excluded.email, role=excluded.role
returning *, auth.uid() as runtime_uid;
```
- If this fails, the error message will specifically mention the failing column/type/check.
- If "runtime_uid" is NULL: Your session/auth is not present—frontend or Auth config problem.

---

## 5. **If Issues Remain: Full Repair Steps**

- If `id` is `text` and cannot be `ALTER`ed due to old data/mismatch:
    1. Backup/export data as CSV.
    2. `DROP TABLE profiles;` and re-create (`id uuid PRIMARY KEY NOT NULL, ...`).
    3. Re-apply insert/update RLS policy using the **current policy from assets/auto_repair_profiles.sql**.
    4. Restore data carefully, matching `id` types.

- If there are legacy constraints/triggers, clear with:
    See: `assets/auto_repair_profiles.sql`

---

## 6. **After Every Fix**

- Re-run the SQLs above in order and ensure each result matches expectations.
- Test signup from frontend; if 500 remains, triple check the session and payload matches and check for invisible column/constraint mismatches.

---

**Reference:**  
- [assets/auto_repair_profiles.sql](./auto_repair_profiles.sql)
- [assets/upsert_rls_diagnostics.md](./upsert_rls_diagnostics.md)
- [assets/supabase.md](./supabase.md)
- [assets/supabase_rls_runtime_diagnosis.sql](./supabase_rls_runtime_diagnosis.sql)

_Last Maintained: 2024-06_

---
_Team note: If these steps do not resolve, provide the exact SQL output/error for each step above to the development team or Supabase support. Do not assume it's app code unless the full schema and triggers checklist is met._
