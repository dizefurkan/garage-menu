/**
 * Supabase Client Setup
 * Handles both client-side (anon key) and server-side (service role) clients
 * @path lib/auth/supabase.ts
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// ============================================================================
// CLIENT-SIDE SUPABASE (uses anon key)
// Use this in browser/client components with RLS policies automatically applied
// ============================================================================
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ============================================================================
// SERVER-SIDE SUPABASE (uses service role key)
// Use this ONLY in server actions for operations that need admin access
// WARNING: Bypasses RLS policies - be careful!
// ============================================================================
export const supabaseAdmin =
  supabaseServiceRoleKey && supabaseUrl
    ? createClient<Database>(supabaseUrl, supabaseServiceRoleKey)
    : null;

// ============================================================================
// SERVER-SIDE SUPABASE WITH USER CONTEXT
// Use this in server components to query with the authenticated user's RLS context
// Must be called with session from client
// ============================================================================
export async function createServerSupabase(accessToken?: string) {
  if (!accessToken) {
    return supabase;
  }

  // Create a new client with the user's access token
  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

  return client;
}
