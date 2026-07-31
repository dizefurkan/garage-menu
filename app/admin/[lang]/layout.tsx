import { redirect, notFound } from "next/navigation";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { routing } from "@/i18n/routing";
import { AdminLayoutClient } from "./layout-client";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }

  // We don't run next-intl's middleware (see i18n/routing.ts), so this is what
  // tells `i18n/request.ts` which locale the request is for. Everything below
  // — server pages and the client provider alike — reads from it.
  setRequestLocale(lang);

  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant) {
    redirect("/auth/login");
  }

  // Fetch enabled addons for this tenant
  let enabledAddons: string[] = [];
  try {
    const { data, error } = await (supabaseAdmin as any)
      .from("tenant_addons")
      .select("addon_key, enabled, expires_at")
      .eq("tenant_id", tenant.id)
      .eq("enabled", true);

    if (!error && data) {
      enabledAddons = data
        .filter((addon: any) => !addon.expires_at || new Date(addon.expires_at) > new Date())
        .map((addon: any) => addon.addon_key);
    }
  } catch (err) {
    console.error("Error fetching enabled addons:", err);
  }

  return (
    // Rendered from a Server Component, so the provider inherits locale,
    // messages and timeZone from i18n/request.ts — no message prop drilling.
    <NextIntlClientProvider>
      <AdminLayoutClient
        user={user}
        tenant={tenant}
        role={role || "viewer"}
        lang={lang}
        enabledAddons={enabledAddons}
      >
        {children}
      </AdminLayoutClient>
    </NextIntlClientProvider>
  );
}
