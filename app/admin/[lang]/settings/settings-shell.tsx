import { getSessionWithTenant } from "@/lib/auth/session";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Every settings route is owner-only and reads the same namespace. Doing it in
 * one place keeps a new sub-page from shipping without the guard.
 *
 * The locale is passed to `getTranslations` explicitly rather than relying on
 * the `setRequestLocale()` call in the admin layout: layouts and pages may
 * render in parallel, so a page must not depend on the layout having run first.
 */
export async function loadSettingsPage(lang: string) {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || role !== "owner") {
    redirect("/admin/dashboard");
  }

  const t = await getTranslations({ locale: lang, namespace: "settings" });

  return { tenant, t };
}

export function SettingsSubPageHeader({
  lang,
  title,
  description,
  backLabel,
}: {
  lang: string;
  title: string;
  description?: string;
  backLabel: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/${lang}/settings`} aria-label={backLabel}>
          <ArrowLeft className="h-4 w-4" />
        </Link>
      </Button>
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  );
}
