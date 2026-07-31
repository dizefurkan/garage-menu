import { Card, CardContent } from "@/components/ui/card";
import { supabaseAdmin } from "@/lib/supabase";
import { ThemeSettings } from "../theme-settings";
import { loadSettingsPage, SettingsSubPageHeader } from "../settings-shell";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function AppearanceSettingsPage({ params }: Props) {
  const { lang } = await params;
  const { tenant, t } = await loadSettingsPage(lang);

  // The category-first layout leans on banner images. Knowing whether any
  // exist lets the theme picker warn before the venue picks a layout that
  // would render as blank tiles.
  const { count: categoriesWithImages } = await (supabaseAdmin as any)
    .from("categories")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenant.id)
    .not("image_url", "is", null);

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsSubPageHeader
        lang={lang}
        title={t("appearance")}
        description={t("appearanceDescription")}
        backLabel={t("backToSettings")}
      />

      <Card>
        <CardContent>
          <ThemeSettings
            tenant={tenant}
            hasCategoryImages={(categoriesWithImages ?? 0) > 0}
          />
        </CardContent>
      </Card>
    </div>
  );
}
