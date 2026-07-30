import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTenantAll } from "@/lib/cache/revalidation";

/**
 * Business identity: name, email, phone.
 *
 * `slug` is deliberately not writable here — printed QR codes point at it, so
 * changing it would silently break every table tent in the venue.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { user, tenant, role } = await getSessionWithTenant();

    if (!user || !tenant || role !== "owner") {
      return NextResponse.json(
        { error: "Unauthorized - must be owner" },
        { status: 403 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const { name, email, phone } = await req.json();

    if (typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    // Empty string means "cleared", not "unchanged": these two are optional and
    // NULL is how the rest of the app reads "not provided".
    const { error: updateError } = await (supabaseAdmin as any)
      .from("tenants")
      .update({
        name: name.trim(),
        email: typeof email === "string" && email.trim() ? email.trim() : null,
        phone: typeof phone === "string" && phone.trim() ? phone.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenant.id);

    if (updateError) {
      console.error("[generalSettings:PATCH] Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update business information" },
        { status: 500 }
      );
    }

    // The venue name is rendered on the public menu and in its page metadata,
    // so a rename has to reach the cached menu rather than wait it out.
    await revalidateTenantAll(tenant.slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[generalSettings:PATCH] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
