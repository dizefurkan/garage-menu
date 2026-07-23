import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * Browser Supabase client that shares the server-set auth cookies
 * (via @supabase/ssr), so it carries the logged-in user's session.
 * Required for Realtime subscriptions on RLS-protected tables — the
 * plain anon client in `lib/supabase.ts` has no session, so
 * `auth.uid()` is null on its socket and RLS filters out every row.
 */
export function createBrowserSupabaseClient() {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}
