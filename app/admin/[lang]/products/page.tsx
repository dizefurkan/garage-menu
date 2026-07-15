import { getSessionWithTenant } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyProductsState } from "@/components/sections/EmptyProductsState";
import { ProductsFilterBar } from "./products-filter-bar";

async function getCategories(tenantId: number, lang: string) {
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
      (t: any) => t.language_code === lang
    ) || cat.category_translations?.[0];
    return {
      id: cat.id,
      name: trans?.name || "N/A",
      productCount: productCountByCategory[cat.id] || 0,
    };
  });
}

async function loadLocaleMessages(lang: string) {
  try {
    const messages = (await import(`@/messages/${lang}.json`)).default;
    return messages.admin ?? {};
  } catch {
    const fallback = (await import('@/messages/en.json')).default;
    return fallback.admin ?? {};
  }
}

function createTranslator(messages: Record<string, string>) {
  return (key: string) => messages[key] || key;
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || (role !== "owner" && role !== "editor")) {
    redirect("/admin/dashboard");
  }

  const messages = await loadLocaleMessages(lang);
  const t = createTranslator(messages);
  const categories = await getCategories(tenant.id, lang);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('products')}</h1>
          <p className="mt-2 text-gray-600">{t('manageProducts')}</p>
        </div>
        {categories.length > 0 && (
          <Link href={`/admin/${lang}/products/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('addNew')}
            </Button>
          </Link>
        )}
      </div>

      {categories.length === 0 ? (
        <EmptyProductsState lang={lang} />
      ) : (
        <ProductsFilterBar tenantId={tenant.id} categories={categories} />
      )}
    </div>
  );
}
