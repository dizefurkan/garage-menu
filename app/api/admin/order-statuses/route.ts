import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { guardAddonAccess } from "@/lib/licensing/hasAddon";
import { ensureDefaultOrderStatuses } from "@/lib/orders/default-statuses";
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

    const includeDisabled = request.nextUrl.searchParams.get("all") === "true";

    const loadStatuses = () => {
      let query = (supabaseAdmin as any)
        .from("order_statuses")
        .select("*")
        .eq("tenant_id", tenant.id)
        .order("sort_order", { ascending: true });

      if (!includeDisabled) {
        query = query.eq("is_enabled", true);
      }
      return query;
    };

    let { data, error } = await loadStatuses();

    if (error) {
      throw new Error(`Failed to fetch order statuses: ${error.message}`);
    }

    if (!data?.length) {
      // Tenants created after the first seed have no statuses yet. Seeding is
      // a no-op for any key that already exists, so an all-disabled list is
      // left alone.
      await ensureDefaultOrderStatuses(supabaseAdmin, tenant.id);
      ({ data, error } = await loadStatuses());
      if (error) {
        throw new Error(`Failed to fetch order statuses: ${error.message}`);
      }
    }

    return NextResponse.json({ statuses: data || [] });
  } catch (error) {
    console.error("Error fetching order statuses:", error);
    return NextResponse.json(
      { error: "Failed to fetch order statuses" },
      { status: 500 }
    );
  }
}
