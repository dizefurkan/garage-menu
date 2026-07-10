/**
 * Server-Side Auth Utilities
 * Helpers for getting current user and tenant in server components/actions
 * @path lib/auth/server.ts
 */

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabase } from "./supabase";
import type { Database } from "@/lib/database.types";
import type { TenantUser, Tenant } from "@/lib/db/schema";

async function createServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {
          // No-op in server components: cookie mutation is only allowed in Server Actions or Route Handlers.
        },
      },
    }
  );
}

// ============================================================================
// GET CURRENT USER SESSION
// ============================================================================
export async function getCurrentUser() {
  const supabaseServer = await createServerSupabase();
  const {
    data: { user },
  } = await supabaseServer.auth.getUser();

  return user;
}

// ============================================================================
// GET CURRENT TENANT (from tenant_users table)
// Call this in admin routes to get the authenticated user's tenant
// ============================================================================
export async function getCurrentTenant(): Promise<Tenant | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabaseServer = await createServerSupabase();

  // Query tenant_users to get user's tenant_id
  const { data: tenantUser, error } = await (supabaseServer as any)
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (error || !tenantUser) {
    console.error("Failed to get tenant:", error);
    return null;
  }

  // Fetch the tenant
  const { data: tenant, error: tenantError } = await (supabaseServer as any)
    .from("tenants")
    .select("*")
    .eq("id", (tenantUser as any).tenant_id)
    .single();

  if (tenantError) {
    console.error("Failed to fetch tenant:", tenantError);
    return null;
  }

  return tenant as Tenant;
}

// ============================================================================
// GET CURRENT TENANT ID (shorthand)
// ============================================================================
export async function getCurrentTenantId(): Promise<bigint | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabaseServer = await createServerSupabase();

  const { data } = await (supabaseServer as any)
    .from("tenant_users")
    .select("tenant_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  return (data as any)?.tenant_id ?? null;
}

// ============================================================================
// CHECK USER ROLE
// Returns the user's role in current tenant
// ============================================================================
export async function getUserRole(
  userId: string
): Promise<"owner" | "editor" | "viewer" | null> {
  const tenantId = await getCurrentTenantId();
  if (!tenantId) return null;

  const supabaseServer = await createServerSupabase();

  const { data } = await (supabaseServer as any)
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", userId)
    .single();

  return (data as any)?.role ?? null;
}

// ============================================================================
// VERIFY USER CAN ACCESS TENANT
// Use this in API routes to ensure user belongs to the requested tenant
// ============================================================================
export async function verifyTenantAccess(tenantId: bigint): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabaseServer = await createServerSupabase();

  const { data } = await (supabaseServer as any)
    .from("tenant_users")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .limit(1);

  return !!(data as any)?.length;
}

// ============================================================================
// VERIFY USER CAN EDIT
// Check if user is owner or editor (not just viewer)
// ============================================================================
export async function verifyCanEdit(tenantId: bigint): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabaseServer = await createServerSupabase();

  const { data } = await (supabaseServer as any)
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .in("role", ["owner", "editor"])
    .single();

  return !!data;
}

// ============================================================================
// VERIFY USER IS OWNER
// Only owners can manage team, invites, theme
// ============================================================================
export async function verifyIsOwner(tenantId: bigint): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const supabaseServer = await createServerSupabase();

  const { data } = await (supabaseServer as any)
    .from("tenant_users")
    .select("role")
    .eq("tenant_id", tenantId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .single();

  return !!data;
}

// ============================================================================
// GET TENANT BY SLUG (for public pages)
// This doesn't require auth - used to populate the public menu
// ============================================================================
export async function getTenantBySlug(slug: string): Promise<Tenant | null> {
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Tenant not found:", error);
    return null;
  }

  return data as Tenant;
}

// ============================================================================
// SEND INVITE EMAIL (with Supabase or external service)
// This is a placeholder - integrate with your email service
// ============================================================================
export async function sendInviteEmail(
  email: string,
  inviteUrl: string,
  tenantName: string
) {
  // TODO: Integrate with Resend, Sendgrid, or your email service
  console.log(`
    [EMAIL] Sent invite to ${email}
    Tenant: ${tenantName}
    Link: ${inviteUrl}
  `);

  // Example with Resend (uncomment and install resend):
  // import { Resend } from 'resend';
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: 'noreply@garage.menu',
  //   to: email,
  //   subject: `You're invited to ${tenantName}`,
  //   html: `Click here to join: <a href="${inviteUrl}">${inviteUrl}</a>`
  // });
}
