import { Card, CardContent } from "@/components/ui/card";
import { LanguageSettingsWrapper } from "../language-settings-wrapper";
import { loadSettingsPage, SettingsSubPageHeader } from "../settings-shell";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function LanguageSettingsPage({ params }: Props) {
  const { lang } = await params;
  const { tenant, t } = await loadSettingsPage(lang);

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsSubPageHeader
        lang={lang}
        title={t("languages")}
        description={t("languagesDescription")}
        backLabel={t("backToSettings")}
      />

      <Card>
        <CardContent>
          <LanguageSettingsWrapper tenant={tenant} currentLang={lang} />
        </CardContent>
      </Card>
    </div>
  );
}
