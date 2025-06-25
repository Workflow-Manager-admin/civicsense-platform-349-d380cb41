import { createClient } from '@supabase/supabase-js';

/**
 * SUPABASE CLIENT INITIALIZATION
 * -------------------------------
 * We use build-time injected environment variables for:
 *   - SUPABASE_URL  : Project URL (should begin with https://)
 *   - SUPABASE_KEY  : Service role key (backend) or anon key (frontend)
 * 
 * During local dev, these are hardcoded. In deployment, use process.env vars or a .env loader at build time.
 * DO NOT expose the service role key in the frontend! Use anon key for client-side use.
 * 
 * If your code breaks after RLS policy updates, see: assets/supabase.md and assets/supabase_applied_rls.sql.
 * 
 * Notes:
 * - The current anon/public API key and the project URL are hardcoded below for development convenience.
 * - Upgrade to loading these from environment variables in production.
 * - All 'profiles' upserts/updates *MUST* include 'id' = user.id to pass RLS policy enforcement.
 */
const supabaseUrl = 'https://kwznqztqlvkeoxjzlhkm.supabase.co'; // See .env/Supabase dashboard for the latest
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk'; // anon/public key ONLY

export const supabase = createClient(supabaseUrl, supabaseKey);
// ↑ Always use anon/public key here. If you see profile upsert/insert errors, check that the client is
//   initialized with the correct project URL/key and that 'id' = user.id is used for upserting to 'profiles'.
//   See assets/supabase.md for latest policy and troubleshooting.
