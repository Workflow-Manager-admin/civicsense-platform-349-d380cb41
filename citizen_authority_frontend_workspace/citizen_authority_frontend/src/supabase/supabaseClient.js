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
/**
 * Returns the value of a named environment variable, handling Create React App and other hosted setups,
 * with fallback support for default keys for development only.
 * - At build: process.env.{NAME} (standard for Webpack/CRA)
 * - At runtime: window._env_ (for injected runtime env, e.g. in Netlify or Cloud Run), else fallback
 */
function getEnv(name, fallback) {
  // Prefer standard process.env injection (Create React App style)
  if (typeof process !== "undefined" && process.env && typeof process.env[name] !== "undefined") {
    return process.env[name];
  }
  // Secondary: runtime-injected global object (window._env_ pattern)
  if (typeof window !== "undefined" && window._env_ && typeof window._env_[name] !== "undefined") {
    return window._env_[name];
  }
  // Also support window.env for some PaaS vendors
  if (typeof window !== "undefined" && window.env && typeof window.env[name] !== "undefined") {
    return window.env[name];
  }
  return fallback;
}

// --- Patch: Warn clearly if dev fallback is being used in (ANY) environment, not just prod.
const supabaseUrl = getEnv(
  "REACT_APP_SUPABASE_URL",
  "https://kwznqztqlvkeoxjzlhkm.supabase.co"
);
const supabaseKey = getEnv(
  "REACT_APP_SUPABASE_KEY",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk"
);

// Patch: Add extra runtime warning if fallback from defaults is used (build context or runtime).
if (
  supabaseKey === "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk"
) {
  // eslint-disable-next-line no-console
  console.warn(
    "[Supabase] WARNING: Using hardcoded fallback API Key! Configure REACT_APP_SUPABASE_KEY in your environment (.env or build config). This is unsafe for any cloud or production deployment."
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);

