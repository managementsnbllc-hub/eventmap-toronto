// ─── Supabase Client ───
// Initialize once, import everywhere.
//
// Setup:
//   1. Create a Supabase project at https://supabase.com
//   2. Copy the URL + anon key from Settings → API
//   3. Set in .env:
//        EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
//        EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
//   4. Run the schema.sql in the SQL Editor
//
// Until Supabase is configured, the app runs on local mocks.

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Flag: is Supabase actually configured?
export const IS_SUPABASE_CONFIGURED = !!(supabaseUrl && supabaseKey);

// Create client (safe to call even without credentials — guarded by IS_SUPABASE_CONFIGURED)
export const supabase = IS_SUPABASE_CONFIGURED
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;

// Quick check helper for services
export function requireSupabase() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in .env'
    );
  }
  return supabase;
}
