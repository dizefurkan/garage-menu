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

/** Preview rows sent to the client. The count returned is always the full
 *  total — only the table the user reads through is truncated. */
const MAX_PREVIEW_ROWS = 50;

type BulkAction = "status" | "delete" | "price";

type PriceChange = {
  id: number;
  old_price: number;
  new_price: number;
};

const parseIds = (value: unknown): number[] =>
  Array.isArray(value)
    ? value
        .map((id: unknown) => Number(id))
        .filter((id: number) => Number.isInteger(id) && id > 0)
    : [];

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

    const productIds = parseIds(body.productIds);

    if (productIds.length > MAX_IDS) {
      return NextResponse.json(
        { error: `Too many products (max ${MAX_IDS})` },
        { status: 400 }
      );
    }

    // "status" and "delete" only ever act on rows the user ticked. "price" can
    // also target every product matching the current filter, which is not
    // expressible as an id list, so it validates its own scope below.
    if (action !== "price" && productIds.length === 0) {
      return NextResponse.json(
        { error: "No products selected" },
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

    if (action === "price") {
      const percent = Number(body.percent);
      const rounding = body.rounding === "whole" ? "whole" : "cent";
      const dryRun = body.dryRun !== false;

      // The SQL function enforces a range too, but a bad number here would come
      // back as a 500-shaped database error rather than a field the user can
      // correct, so it is caught while we still know what it means.
      //
      // Deliberately one step stricter than the function: SQL permits exactly
      // -100% (every price becomes 0.00, which the price_positive CHECK allows)
      // because that is arithmetically sound, but zeroing a whole menu from a
      // bulk tool is far likelier to be a typo than an intent. Someone who
      // really means to give food away can do it per product.
      if (!Number.isFinite(percent) || percent <= -100 || percent > 1000) {
        return NextResponse.json(
          { error: "Percent must be greater than -100 and at most 1000" },
          { status: 400 }
        );
      }

      if (percent === 0) {
        return NextResponse.json(
          { error: "Percent must not be zero" },
          { status: 400 }
        );
      }

      const useFilter = body.scope === "filter";

      if (!useFilter && productIds.length === 0) {
        return NextResponse.json(
          { error: "No products selected" },
          { status: 400 }
        );
      }

      const excludeIds = parseIds(body.excludeIds);
      const categoryId = Number(body.categoryId);

      const { data, error } = await (supabaseAdmin as any).rpc(
        "bulk_adjust_product_prices",
        {
          p_tenant_id: tenant.id,
          p_percent: percent,
          p_updated_by: user.id,
          p_rounding: rounding,
          p_dry_run: dryRun,
          // Passing the id list disables the filter arms inside the function,
          // so exactly one of the two scopes is ever live.
          p_product_ids: useFilter ? null : productIds,
          p_category_id:
            useFilter && Number.isInteger(categoryId) && categoryId > 0
              ? categoryId
              : null,
          p_exclude_ids: useFilter && excludeIds.length > 0 ? excludeIds : null,
        }
      );

      if (error) {
        console.error("[products:bulk] Price adjust error:", error);
        return NextResponse.json(
          { error: "Failed to update prices" },
          { status: 500 }
        );
      }

      const changes = (data ?? []) as PriceChange[];

      // Names and currency are not part of the function's result — it deals in
      // prices — but a preview listing bare ids is unreadable, so they are
      // joined on here for the rows the user will actually see.
      const lang = typeof body.lang === "string" ? body.lang : "en";
      const previewRows = changes.slice(0, MAX_PREVIEW_ROWS);
      const labels = new Map<number, { name: string | null; currency: string }>();

      if (previewRows.length > 0) {
        const { data: details } = await (supabaseAdmin as any)
          .from("products")
          .select("id, currency, product_translations(name, language_code)")
          .eq("tenant_id", tenant.id)
          .in(
            "id",
            previewRows.map((row) => row.id)
          );

        for (const product of details ?? []) {
          const translations = product.product_translations ?? [];
          // Same fallback ladder as the products list: admin language, then
          // English, then whatever exists — a Turkish-only menu still reads.
          const match =
            translations.find((t: any) => t.language_code === lang) ||
            translations.find((t: any) => t.language_code === "en") ||
            translations[0];
          labels.set(product.id, {
            name: match?.name ?? null,
            currency: product.currency || "TRY",
          });
        }
      }

      if (!dryRun && changes.length > 0) {
        await revalidateTenant(tenant.slug, ["products"]);
      }

      return NextResponse.json({
        success: true,
        dryRun,
        affected: changes.length,
        truncated: changes.length > previewRows.length,
        changes: previewRows.map((row) => ({
          id: row.id,
          name: labels.get(row.id)?.name ?? null,
          currency: labels.get(row.id)?.currency ?? "TRY",
          oldPrice: Number(row.old_price),
          newPrice: Number(row.new_price),
        })),
      });
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
