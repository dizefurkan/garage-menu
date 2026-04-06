import { redirect } from "next/navigation";
import { getSessionWithTenant } from "@/lib/auth/session";
import { AdminLayoutClient } from "./layout-client";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant) {
    redirect("/auth/login");
  }

  return (
    <AdminLayoutClient user={user} tenant={tenant} role={role || "viewer"}>
      {children}
    </AdminLayoutClient>
  );
}
