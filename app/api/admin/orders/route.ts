import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { guardAddonAccess } from "@/lib/licensing/hasAddon";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
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

    const searchParams = request.nextUrl.searchParams;
    const statusId = searchParams.get("statusId");
    const tableId = searchParams.get("tableId");
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const offset = (page - 1) * pageSize;

    let query = (supabaseAdmin as any)
      .from("orders")
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
      `,
        { count: "exact" }
      )
      .eq("tenant_id", tenant.id);

    if (statusId) {
      query = query.eq("status_id", parseInt(statusId));
    }

    if (tableId) {
      query = query.eq("table_id", tableId);
    }

    const { data, error, count } = await query
      .range(offset, offset + pageSize - 1)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch orders: ${error.message}`);
    }

    const totalCount = count || 0;
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    // Per-status counts for the status tabs. These are computed
    // independently of `statusId`/pagination (but still respect the table
    // filter) via cheap head-only count queries — so tab badges reflect
    // the true totals rather than whatever happens to be on the current
    // page of results.
    const { data: enabledStatuses } = await (supabaseAdmin as any)
      .from("order_statuses")
      .select("id")
      .eq("tenant_id", tenant.id)
      .eq("is_enabled", true);

    const statusCountEntries = await Promise.all(
      (enabledStatuses || []).map(async (status: { id: number }) => {
        let countQuery = (supabaseAdmin as any)
          .from("orders")
          .select("*", { count: "exact", head: true })
          .eq("tenant_id", tenant.id)
          .eq("status_id", status.id);
        if (tableId) countQuery = countQuery.eq("table_id", tableId);
        const { count: statusCount } = await countQuery;
        return [status.id, statusCount || 0] as const;
      })
    );

    let allCountQuery = (supabaseAdmin as any)
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("tenant_id", tenant.id);
    if (tableId) allCountQuery = allCountQuery.eq("table_id", tableId);
    const { count: allCount } = await allCountQuery;

    // Transform data
    const transformedOrders = (data || []).map((order: any) => {
      const items = (order.order_items || []).map((item: any) => {
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

      return {
        id: order.id,
        table: order.tables,
        status: order.order_statuses,
        note: order.note,
        total_amount: order.total_amount,
        verification_method: order.verification_method,
        verified_at: order.verified_at,
        customer_name: order.customer_name,
        customer_phone: order.customer_phone,
        estimated_ready_at: order.estimated_ready_at,
        created_at: order.created_at,
        updated_at: order.updated_at,
        items: items,
      };
    });

    return NextResponse.json({
      orders: transformedOrders,
      totalCount,
      pageCount: totalPages,
      currentPage: page,
      pageSize,
      statusCounts: Object.fromEntries(statusCountEntries),
      allCount: allCount || 0,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}
