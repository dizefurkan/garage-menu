import { Card, CardContent } from "@/components/ui/card";
import { ContactSettings } from "../contact-settings";
import { loadSettingsPage, SettingsSubPageHeader } from "../settings-shell";

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function ContactSettingsPage({ params }: Props) {
  const { lang } = await params;
  const { tenant, t } = await loadSettingsPage(lang);

  return (
    <div className="max-w-2xl space-y-6">
      <SettingsSubPageHeader
        lang={lang}
        title={t("contactInformation")}
        description={t("contactInformationDescription")}
        backLabel={t("backToSettings")}
      />

      <Card>
        <CardContent>
          <ContactSettings tenant={tenant} />
        </CardContent>
      </Card>
    </div>
  );
}
