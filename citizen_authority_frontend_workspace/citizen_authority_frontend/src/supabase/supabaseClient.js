import { createClient } from '@supabase/supabase-js';

/**
 * PUBLIC_INTERFACE
 * Supabase client for database/auth/storage, configured using environment variables if present
 * Fallbacks to hardcoded dev/staging keys for local dev only.
 * Never check sensitive keys into production code!
 */
const supabaseUrl =
  process.env.REACT_APP_SUPABASE_URL ||
  'https://kwznqztqlvkeoxjzlhkm.supabase.co';

// IMPORTANT: For production, always use env variable for your Supabase key
const supabaseKey =
  process.env.REACT_APP_SUPABASE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk';

export const supabase = createClient(supabaseUrl, supabaseKey);

// For debugging - warn if using a directly-embedded key
if (
  !process.env.REACT_APP_SUPABASE_KEY &&
  window?.location?.hostname !== 'localhost'
) {
  // eslint-disable-next-line no-console
  console.warn(
    '[Supabase] Using fallback API Key! For production, configure REACT_APP_SUPABASE_KEY in your environment.'
  );
}
