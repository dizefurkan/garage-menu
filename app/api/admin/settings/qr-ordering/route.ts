import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { guardAddonAccess } from "@/lib/licensing/hasAddon";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTenantAll } from "@/lib/cache/revalidation";

/**
 * Venue-controlled runtime switch for QR ordering.
 *
 * Distinct from the orders_management addon: the addon says whether the venue
 * bought ordering at all, this says whether they want it on right now. Both
 * gate the customer order endpoint.
 */

export async function GET() {
  try {
    const { user, tenant } = await getSessionWithTenant();

    if (!user || !tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const allowed = await guardAddonAccess(
      tenant,
      "orders_management",
      supabaseAdmin
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      qr_ordering_enabled: tenant.qr_ordering_enabled ?? true,
    });
  } catch (error) {
    console.error("[qrOrdering:GET] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, tenant, role } = await getSessionWithTenant();

    if (!user || !tenant || !role || !["owner", "editor"].includes(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const allowed = await guardAddonAccess(
      tenant,
      "orders_management",
      supabaseAdmin
    );
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { qr_ordering_enabled } = await req.json();

    if (typeof qr_ordering_enabled !== "boolean") {
      return NextResponse.json(
        { error: "qr_ordering_enabled must be a boolean" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const { error: updateError } = await (supabaseAdmin as any)
      .from("tenants")
      .update({
        qr_ordering_enabled,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenant.id);

    if (updateError) {
      console.error("[qrOrdering:PATCH] Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update QR ordering setting" },
        { status: 500 }
      );
    }

    // "Turn it off with one tap" has to mean it — the public menu is cached
    // for 60s, so without an explicit invalidation the venue keeps taking
    // orders for up to a minute after switching off.
    await revalidateTenantAll(tenant.slug);

    return NextResponse.json({ success: true, qr_ordering_enabled });
  } catch (error) {
    console.error("[qrOrdering:PATCH] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
