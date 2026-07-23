import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

interface CreateOrderRequest {
  tenant_slug: string;
  table_id: string;
  items: Array<{
    product_id: number;
    quantity: number;
    selected_options?: Record<string, any>;
    note?: string;
  }>;
  customer_name?: string;
  customer_phone?: string;
  note?: string;
  verification_method?: "wifi" | "pin" | "none";
  pin_code?: string;
}

/**
 * Public endpoint for customers to create orders via QR code.
 * Validates WiFi IP or PIN before creating order.
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const {
      tenant_slug,
      table_id,
      items,
      customer_name,
      customer_phone,
      note,
      verification_method = "none",
      pin_code,
    } = body;

    if (!tenant_slug || !table_id || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: tenant_slug, table_id, items" },
        { status: 400 }
      );
    }

    // Fetch tenant
    const { data: tenant, error: tenantError } = await (supabaseAdmin as any)
      .from("tenants")
      .select("id, slug, verified_network_ip, order_pin_code, order_pin_date")
      .eq("slug", tenant_slug)
      .single();

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: "Restaurant not found" },
        { status: 404 }
      );
    }

    // Check if tenant has Orders addon enabled
    const { data: addon, error: addonError } = await (supabaseAdmin as any)
      .from("tenant_addons")
      .select("enabled, expires_at")
      .eq("tenant_id", tenant.id)
      .eq("addon_key", "orders_management")
      .single();

    if (addonError || !addon?.enabled) {
      return NextResponse.json(
        { error: "Orders not available for this restaurant" },
        { status: 403 }
      );
    }

    // Check if addon has expired
    if (addon.expires_at && new Date(addon.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "Orders feature has expired" },
        { status: 403 }
      );
    }

    // Verify table exists and belongs to tenant
    const { data: table, error: tableError } = await (supabaseAdmin as any)
      .from("tables")
      .select("id")
      .eq("id", table_id)
      .eq("tenant_id", tenant.id)
      .single();

    if (tableError || !table) {
      return NextResponse.json(
        { error: "Table not found" },
        { status: 404 }
      );
    }

    // Verification logic
    let verified = false;
    let actual_verification_method = "none";

    if (verification_method === "wifi" && tenant.verified_network_ip) {
      // Check if client IP matches registered network IP
      const clientIp =
        request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
        request.headers.get("x-real-ip") ||
        request.headers.get("cf-connecting-ip");

      if (clientIp === tenant.verified_network_ip) {
        verified = true;
        actual_verification_method = "wifi";
      } else {
        // WiFi check failed, fall back to PIN. The PIN has no daily
        // expiry — it stays valid until the tenant regenerates it.
        if (tenant.order_pin_code && pin_code === tenant.order_pin_code) {
          verified = true;
          actual_verification_method = "pin";
        }
      }
    } else if (verification_method === "pin" || !verification_method) {
      // PIN verification
      if (tenant.order_pin_code && pin_code === tenant.order_pin_code) {
        verified = true;
        actual_verification_method = "pin";
      }
    }

    // If verification required but failed
    if ((verification_method !== "none") && !verified) {
      return NextResponse.json(
        {
          error: "Verification failed. Invalid PIN or network.",
          requires_verification: true,
        },
        { status: 401 }
      );
    }

    // Get default order status (first awaiting status)
    const { data: defaultStatus, error: statusError } = await (supabaseAdmin as any)
      .from("order_statuses")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("key", "awaiting_approval")
      .limit(1)
      .single();

    if (statusError || !defaultStatus) {
      return NextResponse.json(
        { error: "Order status configuration error" },
        { status: 500 }
      );
    }

    // Calculate total amount by fetching product prices
    let total_amount = 0;
    const validatedItems = [];

    for (const item of items) {
      const { data: product, error: productError } = await (supabaseAdmin as any)
        .from("products")
        .select("price, tenant_id")
        .eq("id", item.product_id)
        .single();

      if (productError || !product || product.tenant_id !== tenant.id) {
        return NextResponse.json(
          { error: `Product ${item.product_id} not found or inaccessible` },
          { status: 404 }
        );
      }

      const item_total = product.price * item.quantity;
      total_amount += item_total;

      validatedItems.push({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: product.price,
        selected_options: item.selected_options || {},
        note: item.note || null,
      });
    }

    // Create order
    const { data: order, error: orderError } = await (supabaseAdmin as any)
      .from("orders")
      .insert({
        tenant_id: tenant.id,
        table_id,
        status_id: defaultStatus.id,
        note: note || null,
        total_amount,
        currency: "TRY",
        verification_method: actual_verification_method,
        verified_at: verified ? new Date().toISOString() : null,
        customer_name: customer_name || null,
        customer_phone: customer_phone || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      );
    }

    // Create order items
    const itemInserts = validatedItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      selected_options: item.selected_options,
      note: item.note,
    }));

    const { error: itemsError } = await (supabaseAdmin as any)
      .from("order_items")
      .insert(itemInserts);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      // Order is created but items failed - this is a partial failure
      return NextResponse.json(
        { error: "Order created but items failed to save" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        order_id: order.id,
        table_id: order.table_id,
        total_amount: order.total_amount,
        items_count: validatedItems.length,
        verification_method: actual_verification_method,
        message: "Order created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
