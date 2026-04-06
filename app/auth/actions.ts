"use server";

import { getSession } from "@/lib/auth/session";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function validateSession() {
  const user = await getSession();
  console.log("[validateSession] User:", user?.email);

  if (!user) return false;

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
            // Error handling
          }
        },
      },
    }
  );

  // Check if user has tenant access
  const { data: tenantUser, error } = await (supabase as any)
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .single();

  console.log("[validateSession] Tenant user:", tenantUser, "Error:", error);
  return !!tenantUser;
}
