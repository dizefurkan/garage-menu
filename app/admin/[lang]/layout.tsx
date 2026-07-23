import { redirect, notFound } from "next/navigation";
import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { AdminLayoutClient } from "./layout-client";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Validate locale
  if (!["en", "tr"].includes(lang)) {
    notFound();
  }

  // Load messages for this locale
  const messages = (await import(`@/messages/${lang}.json`)).default;

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
    <AdminLayoutClient
      user={user}
      tenant={tenant}
      role={role || "viewer"}
      lang={lang}
      messages={messages}
      enabledAddons={enabledAddons}
    >
      {children}
    </AdminLayoutClient>
  );
}
