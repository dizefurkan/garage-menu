import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { guardAddonAccess } from "@/lib/licensing/hasAddon";
import { NextResponse } from "next/server";

/**
 * Generates a new 4-digit order verification PIN and overrides the
 * tenant's current one. No history is kept — regenerating simply
 * replaces the single stored code.
 */
export async function POST() {
  try {
    const { user, tenant } = await getSessionWithTenant();

    if (!user || !tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const hasAccess = await guardAddonAccess(tenant, "orders_management", supabaseAdmin);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Orders & Tables addon not enabled" },
        { status: 403 }
      );
    }

    const pinCode = Math.floor(1000 + Math.random() * 9000).toString();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await (supabaseAdmin as any)
      .from("tenants")
      .update({
        order_pin_code: pinCode,
        order_pin_date: today,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenant.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      pin_code: data.order_pin_code,
      pin_date: data.order_pin_date,
    });
  } catch (error) {
    console.error("Error generating PIN:", error);
    return NextResponse.json(
      { error: "Failed to generate PIN" },
      { status: 500 }
    );
  }
}
