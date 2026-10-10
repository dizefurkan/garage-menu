import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { guardAddonAccess } from "@/lib/licensing/hasAddon";
import { NextRequest, NextResponse } from "next/server";

/**
 * Venue-controlled switch for order verification. On: a guest must be on the
 * registered WiFi or enter the PIN. Off: orders are accepted without either.
 * Read together with the other order-settings data by GET /network/verify-ip.
 */

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

    const { order_pin_required } = await req.json();

    if (typeof order_pin_required !== "boolean") {
      return NextResponse.json(
        { error: "order_pin_required must be a boolean" },
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
        order_pin_required,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenant.id);

    if (updateError) {
      console.error("[orderPin:PATCH] Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update order PIN setting" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, order_pin_required });
  } catch (error) {
    console.error("[orderPin:PATCH] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
