import { getSessionWithTenant } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";
import { EmptyProductsState } from "@/components/sections/EmptyProductsState";
import { ProductsFilterBar } from "./products-filter-bar";

async function getCategories(tenantId: number) {
  if (!supabaseAdmin) {
    return [];
  }

  // Get categories
  const { data, error } = await (supabaseAdmin as any)
    .from("categories")
    .select("id, category_translations(name, language_code)")
    .eq("tenant_id", tenantId);

  if (error) {
    console.error("[getCategories] Database error:", error);
    return [];
  }

  // Get product counts per category
  const { data: productData } = await (supabaseAdmin as any)
    .from("products")
    .select("category_id")
    .eq("tenant_id", tenantId);

  const productCountByCategory = (productData || []).reduce(
    (acc: any, prod: any) => {
      acc[prod.category_id] = (acc[prod.category_id] || 0) + 1;
      return acc;
    },
    {}
  );

  return (data || []).map((cat: any) => {
    const trans = cat.category_translations?.find(
      (t: any) => t.language_code === "en"
    );
    return {
      id: cat.id,
      name: trans?.name || cat.category_translations?.[0]?.name || "N/A",
      productCount: productCountByCategory[cat.id] || 0,
    };
  });
}

export default async function ProductsPage() {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || (role !== "owner" && role !== "editor")) {
    redirect("/admin/dashboard");
  }

  const categories = await getCategories(tenant.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Ürünler</h1>
        <p className="mt-2 text-gray-600">Menü ürünlerinizi yönetin</p>
      </div>

      {categories.length === 0 ? (
        <EmptyProductsState />
      ) : (
        <ProductsFilterBar tenantId={tenant.id} categories={categories} />
      )}
    </div>
  );
}
