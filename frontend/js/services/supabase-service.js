import { getRuntimeSupabaseUrl, getRuntimeSupabaseAnonKey } from '../config/runtime-config.js';

const supabaseUrl = getRuntimeSupabaseUrl();
const supabaseAnonKey = getRuntimeSupabaseAnonKey();

let clientPromise = null;

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export async function getSupabaseClient() {
  if (!hasSupabaseConfig()) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.');
  }

  if (!clientPromise) {
    clientPromise = import('https://esm.sh/@supabase/supabase-js@2').then(({ createClient }) =>
      createClient(supabaseUrl, supabaseAnonKey),
    );
  }

  return clientPromise;
}
