import { redirect, notFound } from "next/navigation";
import { getSessionWithTenant } from "@/lib/auth/session";
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

  return (
    <AdminLayoutClient
      user={user}
      tenant={tenant}
      role={role || "viewer"}
      lang={lang}
      messages={messages}
    >
      {children}
    </AdminLayoutClient>
  );
}
