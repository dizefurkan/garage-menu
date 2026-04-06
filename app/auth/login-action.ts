"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function signInWithEmail(email: string, password: string) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Cookie setting error
          }
        },
      },
    }
  );

  const { error, data } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Use service role client to verify tenant access
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = data.user?.id;
  if (!userId) {
    return { error: "User ID not found after login" };
  }

  console.log(
    "[signInWithEmail] Auth successful for:",
    email,
    "User ID:",
    userId
  );

  const { data: tenantUser, error: tenantError } = (await supabaseAdmin
    .from("tenant_users")
    .select("*")
    .eq("user_id", userId)
    .single()) as any;

  console.log(
    "[signInWithEmail] Tenant user query result:",
    tenantUser,
    "Error:",
    tenantError
  );

  if (tenantError || !tenantUser) {
    return {
      error: `You do not have access to any organization (${tenantError?.message || "no record"})`,
    };
  }

  console.log(
    "[signInWithEmail] Login successful for:",
    email,
    "Tenant:",
    (tenantUser as any).tenant_id
  );

  return { success: true };
}
