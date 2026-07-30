import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { ThemeConfigSchema } from "@/lib/utils/validation";
import { NextRequest, NextResponse } from "next/server";
import { revalidateTenantAll } from "@/lib/cache/revalidation";

// These mirror the tenants_*_valid CHECK constraints. Validating here turns a
// bad value into a 400 instead of a 500 from the database.
const MENU_LAYOUTS = ["products", "categories"] as const;
const CATEGORY_SORTS = ["manual", "alphabetical", "popularity"] as const;
const PRODUCT_SORTS = [
  "manual",
  "alphabetical",
  "popularity",
  "price_asc",
  "price_desc",
  "newest",
] as const;

export async function PATCH(req: NextRequest) {
  try {
    const { user, tenant, role } = await getSessionWithTenant();

    if (!user || !tenant || role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const {
      tenant_id,
      theme_config,
      menu_layout,
      category_sort,
      product_sort,
    } = await req.json();

    if (tenant_id !== tenant.id) {
      return NextResponse.json({ error: "Tenant mismatch" }, { status: 403 });
    }

    // Validate theme config
    const validatedConfig = ThemeConfigSchema.parse(theme_config);

    // Menu layout lives in its own column, not inside theme_config — that
    // schema is hex colours and a font, and a structural flag doesn't belong
    // in it. Validated here so a bad value fails as 400 rather than as a
    // database CHECK violation.
    if (menu_layout !== undefined && !MENU_LAYOUTS.includes(menu_layout)) {
      return NextResponse.json(
        { error: "Invalid menu_layout" },
        { status: 400 }
      );
    }

    if (
      category_sort !== undefined &&
      !CATEGORY_SORTS.includes(category_sort)
    ) {
      return NextResponse.json(
        { error: "Invalid category_sort" },
        { status: 400 }
      );
    }

    if (product_sort !== undefined && !PRODUCT_SORTS.includes(product_sort)) {
      return NextResponse.json(
        { error: "Invalid product_sort" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const tenantUpdate: Record<string, unknown> = {
      theme_config: validatedConfig,
      updated_at: new Date().toISOString(),
    };
    if (menu_layout !== undefined) {
      tenantUpdate.menu_layout = menu_layout;
    }
    if (category_sort !== undefined) {
      tenantUpdate.category_sort = category_sort;
    }
    if (product_sort !== undefined) {
      tenantUpdate.product_sort = product_sort;
    }

    const { error: updateError } = await (supabaseAdmin as any)
      .from("tenants")
      .update(tenantUpdate)
      .eq("id", tenant.id);

    if (updateError) {
      console.error("[updateTheme] Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update theme" },
        { status: 500 }
      );
    }

    await revalidateTenantAll(tenant.slug);

    return NextResponse.json({
      success: true,
      message: "Theme updated successfully",
    });
  } catch (error) {
    console.error("[updateTheme] Exception:", error);

    if (error instanceof Error && error.message.includes("Invalid")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
