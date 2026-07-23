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

    // Check addon access
    const hasAccess = await guardAddonAccess(tenant, "orders_management", supabaseAdmin);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Orders & Tables addon not enabled" },
        { status: 403 }
      );
    }

    const { status_id, note, estimated_ready_at, customer_name, customer_phone } =
      await request.json();

    const { id } = await params;

    const updates: any = { updated_at: new Date().toISOString() };

    if (status_id !== undefined) updates.status_id = status_id;
    if (note !== undefined) updates.note = note;
    if (estimated_ready_at !== undefined) updates.estimated_ready_at = estimated_ready_at;
    if (customer_name !== undefined) updates.customer_name = customer_name;
    if (customer_phone !== undefined) updates.customer_phone = customer_phone;

    const { data, error } = await (supabaseAdmin as any)
      .from("orders")
      .update(updates)
      .eq("id", id)
      .eq("tenant_id", tenant.id)
      .select(
        `
        id,
        table_id,
        status_id,
        note,
        total_amount,
        verification_method,
        verified_at,
        customer_name,
        customer_phone,
        estimated_ready_at,
        created_at,
        updated_at,
        order_statuses(id, key, label, color),
        tables(id, label),
        order_items(
          id,
          product_id,
          quantity,
          unit_price,
          note,
          selected_options,
          products(id, product_translations(name, language_code))
        )
      `
      )
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Transform response
    const items = (data.order_items || []).map((item: any) => {
      const nameTranslation =
        item.products?.product_translations?.find((t: any) => t.language_code === "en") ||
        item.products?.product_translations?.[0];
      return {
        id: item.id,
        product_id: item.product_id,
        product_name: nameTranslation?.name || "Unknown",
        quantity: item.quantity,
        unit_price: item.unit_price,
        note: item.note,
        selected_options: item.selected_options,
      };
    });

    const transformedOrder = {
      id: data.id,
      table: data.tables,
      status: data.order_statuses,
      note: data.note,
      total_amount: data.total_amount,
      verification_method: data.verification_method,
      verified_at: data.verified_at,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      estimated_ready_at: data.estimated_ready_at,
      created_at: data.created_at,
      updated_at: data.updated_at,
      items: items,
    };

    return NextResponse.json({ success: true, order: transformedOrder });
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json(
      { error: "Failed to update order" },
      { status: 500 }
    );
  }
}
