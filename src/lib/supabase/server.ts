/**
 * Supabase Client for Server
 * Uses Service Role key for admin operations
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let serverClient: ReturnType<typeof createSupabaseClient> | null = null;

export function createClient() {
  if (serverClient) {
    return serverClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase server environment variables');
  }

  serverClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return serverClient;
}
