import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { guardAddonAccess } from "@/lib/licensing/hasAddon";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const { is_enabled } = await request.json();

    if (typeof is_enabled !== "boolean") {
      return NextResponse.json(
        { error: "is_enabled must be a boolean" },
        { status: 400 }
      );
    }

    const { data, error } = await (supabaseAdmin as any)
      .from("order_statuses")
      .update({ is_enabled })
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Status not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, status: data });
  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
