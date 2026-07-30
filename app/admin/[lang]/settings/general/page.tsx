import { Card, CardContent } from "@/components/ui/card";
import { GeneralSettings } from "../general-settings";
import { loadSettingsPage, SettingsSubPageHeader } from "../settings-shell";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function GeneralSettingsPage({ params }: Props) {
  const { lang } = await params;
  const { tenant, settingsMessages, t } = await loadSettingsPage(lang);

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsSubPageHeader
        lang={lang}
        title={t("basicInformation", "Basic Information")}
        description={t(
          "basicInformationDescription",
          "Business name, email and phone."
        )}
        backLabel={t("backToSettings", "Back to settings")}
      />

      <Card>
        <CardContent>
          <GeneralSettings tenant={tenant} messages={settingsMessages} />
        </CardContent>
      </Card>
    </div>
  );
}
