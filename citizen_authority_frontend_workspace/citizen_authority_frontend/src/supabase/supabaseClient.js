import { createClient } from '@supabase/supabase-js';

/**
 * PUBLIC_INTERFACE
 * Supabase client for database/auth/storage, configured using environment variables if present
 * Fallbacks to hardcoded dev/staging keys for local dev only.
 * Never check sensitive keys into production code!
 */
/**
 * Get environment variable safely in browser bundle.
 * This prevents 'process is not defined' errors when process is undefined,
 * e.g. when not replaced by webpack (or similar tool).
 * Fallback to default if not present.
 */
function getEnv(name, fallback) {
  // window.process will not exist in React/browser; only process.env should exist at build time.
  if (typeof process !== "undefined" && process.env && typeof process.env[name] !== "undefined") {
    return process.env[name];
  }
  // Try to fall back to window._env_ (some setups inject here)
  if (typeof window !== "undefined" && window._env_ && typeof window._env_[name] !== "undefined") {
    return window._env_[name];
  }
  return fallback;
}

const supabaseUrl = getEnv(
  "REACT_APP_SUPABASE_URL",
  "https://kwznqztqlvkeoxjzlhkm.supabase.co"
);
const supabaseKey = getEnv(
  "REACT_APP_SUPABASE_KEY",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk"
);

export const supabase = createClient(supabaseUrl, supabaseKey);

// For debugging - warn if using a directly-embedded key (but **never** error if process is missing)
if (
  (!getEnv("REACT_APP_SUPABASE_KEY") || getEnv("REACT_APP_SUPABASE_KEY") === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk") &&
  typeof window !== "undefined" &&
  window.location &&
  window.location.hostname !== "localhost"
) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Supabase] Using fallback API Key! For production, configure REACT_APP_SUPABASE_KEY in your environment."
  );
}
