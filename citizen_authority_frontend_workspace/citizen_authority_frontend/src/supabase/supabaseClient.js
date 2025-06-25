import { createClient } from '@supabase/supabase-js';

// ✅ ONLY the anon/public key — never use service_role key in frontend
const supabaseUrl = 'https://kwznqztqlvkeoxjzlhkm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt3em5xenRxbHZrZW94anpsaGttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwNzIzMzMsImV4cCI6MjA2NTY0ODMzM30.4SBDmL0SuVsGqQeubAKjVH0lXX5JInlM-f5vg4gFHsk';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      Accept: 'application/json'
    }
  }
});
