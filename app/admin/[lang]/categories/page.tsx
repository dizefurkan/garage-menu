import { getSessionWithTenant } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { EmptyCategoriesState } from "@/components/sections/EmptyCategoriesState";
import { CategoriesTable } from "./categories-table";

async function getCategories(tenantId: number, lang: string) {
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

      const trans = category.category_translations?.find(
        (t: any) => t.language_code === lang
      ) || category.category_translations?.[0];

      return {
        ...category,
        name: trans?.name || "N/A",
        productCount: count || 0,
      };
    })
  );

  return categoriesWithCount;
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

export default async function CategoriesPage({
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
          <h1 className="text-3xl font-bold tracking-tight">{t('categories')}</h1>
          <p className="mt-2 text-gray-600">{t('manageCategories')}</p>
        </div>
        {categories.length > 0 && (
          <Link href={`/admin/${lang}/categories/new`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('categoriesAddNew')}
            </Button>
          </Link>
        )}
      </div>

      {categories.length === 0 ? (
        <EmptyCategoriesState lang={lang} />
      ) : (
        <CategoriesTable categories={categories} />
      )}
    </div>
  );
}
