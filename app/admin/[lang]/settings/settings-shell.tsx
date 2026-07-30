import { getSessionWithTenant } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Every settings route is owner-only and reads the same message bundle. Doing
 * it in one place keeps a new sub-page from shipping without the guard.
 */
export async function loadSettingsPage(lang: string) {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || role !== "owner") {
    redirect("/admin/dashboard");
  }

  const messages = (await import(`@/messages/${lang}.json`)).default;
  const settingsMessages = (messages.settings || {}) as Record<string, string>;

  const t = (key: string, defaultValue: string = "") =>
    settingsMessages[key] || defaultValue;

  return { tenant, settingsMessages, t };
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
