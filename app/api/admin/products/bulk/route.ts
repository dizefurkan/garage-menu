import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTenant } from "@/lib/cache/revalidation";

/**
 * Bulk operations on products selected in the admin table.
 *
 * Every statement is filtered by `tenant_id` as well as the id list, so a
 * forged id from another venue matches nothing rather than being trusted
 * because it arrived in the request body.
 */

const MAX_IDS = 500;

type BulkAction = "status" | "delete";

export async function POST(req: NextRequest) {
  try {
    const { user, tenant, role } = await getSessionWithTenant();

    if (!user || !tenant || (role !== "owner" && role !== "editor")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const action = body.action as BulkAction;

    const productIds = Array.isArray(body.productIds)
      ? body.productIds
          .map((id: unknown) => Number(id))
          .filter((id: number) => Number.isInteger(id) && id > 0)
      : [];

    if (productIds.length === 0) {
      return NextResponse.json(
        { error: "No products selected" },
        { status: 400 }
      );
    }

    if (productIds.length > MAX_IDS) {
      return NextResponse.json(
        { error: `Too many products (max ${MAX_IDS})` },
        { status: 400 }
      );
    }

    if (action === "status") {
      const { is_available, is_out_of_stock } = body;

      if (
        typeof is_available !== "boolean" ||
        typeof is_out_of_stock !== "boolean"
      ) {
        return NextResponse.json(
          { error: "is_available and is_out_of_stock must be booleans" },
          { status: 400 }
        );
      }

      const { data, error } = await (supabaseAdmin as any)
        .from("products")
        .update({
          is_available,
          is_out_of_stock,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq("tenant_id", tenant.id)
        .in("id", productIds)
        .select("id");

      if (error) {
        console.error("[products:bulk] Status update error:", error);
        return NextResponse.json(
          { error: "Failed to update products" },
          { status: 500 }
        );
      }

      await revalidateTenant(tenant.slug, ["products"]);
      return NextResponse.json({ success: true, affected: data?.length ?? 0 });
    }

    if (action === "delete") {
      const { data, error } = await (supabaseAdmin as any)
        .from("products")
        .delete()
        .eq("tenant_id", tenant.id)
        .in("id", productIds)
        .select("id");

      if (error) {
        console.error("[products:bulk] Delete error:", error);
        return NextResponse.json(
          { error: "Failed to delete products" },
          { status: 500 }
        );
      }

      await revalidateTenant(tenant.slug, ["products"]);
      return NextResponse.json({ success: true, affected: data?.length ?? 0 });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    console.error("[products:bulk] Exception:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
