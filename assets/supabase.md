# Supabase Integration Notes for CivicSense Backend

## Issues Table Soft Delete Implementation

- The `issues` table in Supabase **must include** an `is_deleted` (boolean, default: false) column.
    - This field will be set to `True` instead of deleting records.
    - All primary queries from the backend should return only `is_deleted = false` records, unless explicitly instructed (as in the `/issues/deleted` endpoint).
    - When a user requests deletion of an issue via the backend API, set `is_deleted = true` for that issue instead of a real DELETE.

**Migration Instruction (run once via Supabase SQL editor or migration):**
```sql
ALTER TABLE issues ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
```

### Required Environment Variables

- SUPABASE_URL: your Supabase project REST API URL
- SUPABASE_KEY: service role or anon (with relevant rights)
- SUPABASE_DB_URL: connection string (not used for REST API, but available)

This configuration enables soft delete for issues and ensures all compliant endpoints.
