"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

export async function getSession() {
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
            // Error handling is done in the middleware
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getSessionWithTenant(): Promise<{
  user: any;
  tenant: Database["public"]["Tables"]["tenants"]["Row"] | null;
  role: string | null;
}> {
  const user = await getSession();

  if (!user) {
    console.log("[getSessionWithTenant] No user");
    return { user: null, tenant: null, role: null };
  }

  console.log("[getSessionWithTenant] User:", user.email, "ID:", user.id);

  // Use service role to bypass RLS and query tenant_users
  const supabaseAdmin = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tenantUser, error: tenantError } = (await supabaseAdmin
    .from("tenant_users")
    .select("tenant_id, role")
    .eq("user_id", user.id)
    .single()) as any;

  console.log(
    "[getSessionWithTenant] Tenant user:",
    tenantUser,
    "Error:",
    tenantError
  );

  if (!tenantUser) {
    console.log("[getSessionWithTenant] No tenant user found");
    return { user, tenant: null, role: null };
  }

  const { data: tenant, error: tenantDataError } = (await supabaseAdmin
    .from("tenants")
    .select("*")
    .eq("id", (tenantUser as any).tenant_id)
    .single()) as any;

  console.log(
    "[getSessionWithTenant] Tenant:",
    (tenant as any)?.name,
    "Error:",
    tenantDataError
  );
  return { user, tenant: tenant || null, role: (tenantUser as any).role };
}
