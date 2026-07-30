import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { redirect, notFound } from "next/navigation";
import { TranslationsWorkbench } from "./translations-workbench";
import { SettingsSubPageHeader } from "../settings-shell";

type SearchParams = {
  target?: string;
  type?: string;
  id?: string;
};

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<SearchParams>;
}

function getLanguageLabel(languageCode: string) {
  try {
    const normalizedCode = languageCode.toLowerCase();
    const baseLanguage = normalizedCode.split("-")[0];
    const displayNames = new Intl.DisplayNames([normalizedCode], {
      type: "language",
    });

    return displayNames.of(baseLanguage) || languageCode.toUpperCase();
  } catch {
    return languageCode.toUpperCase();
  }
}

export default async function TranslationPage({ params, searchParams }: Props) {
  const { lang } = await params;
  const query = await searchParams;
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || (role !== "owner" && role !== "editor")) {
    redirect(`/admin/${lang}/dashboard`);
  }

  if (!supabaseAdmin) {
    notFound();
  }

  const languages =
    Array.isArray(tenant.languages) && tenant.languages.length
      ? tenant.languages
      : [tenant.default_language || "en"];

  const sourceLanguage = languages[0] || tenant.default_language || "en";
  const availableTargetLanguages =
    languages.length > 1
      ? languages.filter((language) => language !== sourceLanguage)
      : languages;

  const targetLanguage =
    query.target && availableTargetLanguages.includes(query.target)
      ? query.target
      : availableTargetLanguages[0] || "";

  const [categoriesResult, productsResult] = await Promise.all([
    (supabaseAdmin as any)
      .from("categories")
      .select(
        "id, display_order, created_at, category_translations(language_code, name, description)"
      )
      .eq("tenant_id", tenant.id)
      .order("id"),
    (supabaseAdmin as any)
      .from("products")
      .select(
        "id, category_id, price, currency, image_url, is_available, is_draft, created_at, display_order, product_translations(language_code, name, description)"
      )
      .eq("tenant_id", tenant.id)
      .order("id"),
  ]);

  const categories = categoriesResult.data || [];
  const products = productsResult.data || [];

  const initialType = query.type === "category" ? "category" : "product";
  const initialId = query.id ? Number(query.id) : null;

  // Editors reach this page too, so it keeps its own guard above rather than
  // going through the owner-only loadSettingsPage.
  const messages = (await import(`@/messages/${lang}.json`)).default;
  const settingsMessages = (messages.settings || {}) as Record<string, string>;
  const t = (key: string, defaultValue: string = "") =>
    settingsMessages[key] || defaultValue;

  return (
    <div className="space-y-6">
      <SettingsSubPageHeader
        lang={lang}
        title={t("translations", "Translations")}
        description={t(
          "translationsDescription",
          "Translate products and categories faster"
        )}
        backLabel={t("backToSettings", "Back to settings")}
      />

      <TranslationsWorkbench
        categories={categories}
        initialEntityId={
          Number.isFinite(initialId as number) ? initialId : null
        }
        initialEntityType={initialType}
        products={products}
        sourceLanguage={sourceLanguage}
        targetLanguage={targetLanguage}
        targetLanguageOptions={availableTargetLanguages}
        targetLanguageLabels={languages.reduce(
          (acc, language) => {
            acc[language] = getLanguageLabel(language);
            return acc;
          },
          {} as Record<string, string>
        )}
      />
    </div>
  );
}
