import { redirect } from "next/navigation";
import { getSessionWithTenant } from "@/lib/auth/session";

export default async function Page() {
  const { user } = await getSessionWithTenant();

  if (user) {
    // If logged in, redirect to admin dashboard
    redirect("/admin/dashboard");
  } else {
    // If not logged in, redirect to login
    redirect("/auth/login");
  }
}
