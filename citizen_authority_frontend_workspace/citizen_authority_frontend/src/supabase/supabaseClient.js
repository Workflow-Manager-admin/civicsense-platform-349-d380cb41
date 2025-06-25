import { createClient } from '@supabase/supabase-js';

/**
 * SUPABASE CLIENT INITIALIZATION (RLS/Profiles Upsert-Ready)
 *
 * - Uses project URL and anon PUBLIC KEY for front-end only.
 * - DO NOT expose service_role key here; ONLY use anon/public API key.
 * - Set env vars (SUPABASE_URL/SUPABASE_KEY) at build for production; hardcoded for local dev (see below).
 * - Upserts/inserts to 'profiles' table *must* use { id, email, role }, and 'id' == user.id (from Auth).   *
 * - See assets/supabase.md for diagnosis if you see any 403/406 errors on upsert/profile APIs.
 *
 * -- RLS: The only valid upsert/insert policy for 'profiles' is:
 *    CREATE POLICY "Users can insert or update their own profile"
 *      ON profiles FOR INSERT, UPDATE
 *      USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
 */
/* TODO: Use environment variables for production deployment */
const supabaseUrl = 'https://kwznqztqlvkeoxjzlhkm.supabase.co'; // Update as needed
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk'; // ANON key only!

/**
 * Create the Supabase JS client:
 * - All requests set Accept: application/json internally.
 * - If you encounter persistent 406 errors, check Accept header, session, and RLS as per assets/upsert_rls_diagnostics.md
 */
export const supabase = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: true
    },
    global: {
      // Defensive for fetch (406-proxy fix): always accept JSON for all endpoints
      headers: { 'Accept': 'application/json' }
    }
  }
);

// ↑ Always use ANON/public key, and check see-upsert diagnostics if insert fails.
//   See: assets/supabase.md and assets/upsert_rls_diagnostics.md for full diagnosis instructions.
