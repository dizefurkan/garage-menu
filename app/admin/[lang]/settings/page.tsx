import { getSessionWithTenant } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSettingsWrapper } from "./language-settings-wrapper";
import { ThemeSettings } from "./theme-settings";
import { ContactSettings } from "./contact-settings";

interface Props {
  params: Promise<{
    lang: string;
  }>;
}

export default async function SettingsPage({ params }: Props) {
  const { lang } = await params;
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || role !== "owner") {
    redirect("/admin/dashboard");
  }

  // Load messages for this locale
  const messages = (await import(`@/messages/${lang}.json`)).default;
  const settingsMessages = messages.settings || {};

  const t = (key: string, defaultValue: string = "") => {
    return (
      (settingsMessages[key as keyof typeof settingsMessages] as string) ||
      defaultValue
    );
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("title", "Settings")}
        </h1>
        <p className="mt-2 text-gray-600">
          {t("description", "Manage your restaurant information")}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("basicInformation", "Basic Information")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                {t("restaurantName", "Restaurant Name")}
              </label>
              <Input
                defaultValue={tenant.name}
                placeholder="e.g. Garage Chocolate"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {t("email", "Email")}
              </label>
              <Input
                type="email"
                defaultValue={tenant.email || ""}
                placeholder="info@restaurant.com"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {t("phone", "Phone")}
              </label>
              <Input
                defaultValue={tenant.phone || ""}
                placeholder="+90 555 123 4567"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                {t("menuSlug", "Menu Slug")}
              </label>
              <Input value={tenant.slug} disabled className="bg-gray-100" />
              <p className="mt-1 text-xs text-gray-500">
                {t(
                  "slugDescription",
                  `Your public menu URL: /${tenant.slug}/en`
                )}
              </p>
            </div>

            <Button type="submit">{t("saveChanges", "Save Changes")}</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("languages", "Languages")}</CardTitle>
        </CardHeader>
        <CardContent>
          <LanguageSettingsWrapper
            tenant={tenant}
            currentLang={lang}
            messages={settingsMessages as Record<string, string>}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearance", "Appearance")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ThemeSettings
            tenant={tenant}
            messages={settingsMessages as Record<string, string>}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {t("contactInformation", "Contact Information")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ContactSettings
            tenant={tenant}
            messages={settingsMessages as Record<string, string>}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete Restaurant
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
