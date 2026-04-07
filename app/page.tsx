import { redirect } from "next/navigation";
import { getSessionWithTenant } from "@/lib/auth/session";

export default async function Page() {
  const { user } = await getSessionWithTenant();

  if (user) {
    // If logged in, redirect to admin dashboard (English by default)
    redirect("/admin/en/dashboard");
  } else {
    // If not logged in, redirect to landing page (EN is default locale)
    redirect("/en");
  }
}
