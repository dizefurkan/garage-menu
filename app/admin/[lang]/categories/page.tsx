import { getSessionWithTenant } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { DataTable } from "@/components/ui/data-table";
import { EmptyCategoriesState } from "@/components/sections/EmptyCategoriesState";
import { columns } from "./columns";

async function getCategories(tenantId: number) {
  if (!supabaseAdmin) {
    return [];
  }

  const { data } = await (supabaseAdmin as any)
    .from("categories")
    .select(
      `
      id,
      created_at,
      is_draft,
      display_order,
      category_translations(name, language_code)
    `
    )
    .eq("tenant_id", tenantId)
    .order("display_order");

  // Get product count for each category
  const categoriesWithCount = await Promise.all(
    (data || []).map(async (category: any) => {
      const { count } = await (supabaseAdmin as any)
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("category_id", category.id)
        .eq("tenant_id", tenantId)
        .not("is_draft", "eq", true); // Count only published products

      return {
        ...category,
        name:
          category.category_translations?.find(
            (t: any) => t.language_code === "en"
          )?.name || "N/A",
        productCount: count || 0,
      };
    })
  );

  return categoriesWithCount;
}

export default async function CategoriesPage() {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || (role !== "owner" && role !== "editor")) {
    redirect("/admin/dashboard");
  }

  const categories = await getCategories(tenant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kategoriler</h1>
        <p className="mt-2 text-gray-600">Menünüzü organize edin</p>
      </div>

      {categories.length === 0 ? (
        <EmptyCategoriesState />
      ) : (
        <DataTable columns={columns} data={categories} />
      )}
    </div>
  );
}
