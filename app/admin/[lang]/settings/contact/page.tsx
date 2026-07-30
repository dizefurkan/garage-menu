import { Card, CardContent } from "@/components/ui/card";
import { ContactSettings } from "../contact-settings";
import { loadSettingsPage, SettingsSubPageHeader } from "../settings-shell";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function ContactSettingsPage({ params }: Props) {
  const { lang } = await params;
  const { tenant, settingsMessages, t } = await loadSettingsPage(lang);

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsSubPageHeader
        lang={lang}
        title={t("contactInformation", "Contact Information")}
        description={t(
          "contactInformationDescription",
          "Address and the social accounts shown on your menu."
        )}
        backLabel={t("backToSettings", "Back to settings")}
      />

      <Card>
        <CardContent>
          <ContactSettings tenant={tenant} messages={settingsMessages} />
        </CardContent>
      </Card>
    </div>
  );
}
