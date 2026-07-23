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

    const { data, error } = await (supabaseAdmin as any)
      .from("tables")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("display_order", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch tables: ${error.message}`);
    }

    return NextResponse.json({ tables: data || [] });
  } catch (error) {
    console.error("Error fetching tables:", error);
    return NextResponse.json(
      { error: "Failed to fetch tables" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { label, count, notes } = body;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Get the max display_order to continue from
    const { data: maxOrderData } = await (supabaseAdmin as any)
      .from("tables")
      .select("display_order")
      .eq("tenant_id", tenant.id)
      .order("display_order", { ascending: false })
      .limit(1)
      .single();

    const maxOrder = maxOrderData?.display_order ?? 0;

    // Bulk insert if count is provided, otherwise single insert
    if (count && count > 1) {
      const tables = Array.from({ length: count }, (_, i) => ({
        tenant_id: tenant.id,
        label: `Masa ${i + 1}`,
        display_order: maxOrder + i + 1,
        is_active: true,
        notes: notes || null,
      }));

      const { data, error } = await (supabaseAdmin as any)
        .from("tables")
        .insert(tables)
        .select();

      if (error) {
        console.error("Bulk table creation error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        tables_created: data?.length || 0,
        tables: data,
      });
    } else {
      // Single table insert
      const { data, error } = await (supabaseAdmin as any)
        .from("tables")
        .insert({
          tenant_id: tenant.id,
          label: label || "Yeni Masa",
          display_order: maxOrder + 1,
          is_active: true,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) {
        console.error("Table creation error:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        table_id: data.id,
        table: data,
      });
    }
  } catch (error) {
    console.error("Error creating tables:", error);
    return NextResponse.json(
      { error: "Failed to create tables" },
      { status: 500 }
    );
  }
}
