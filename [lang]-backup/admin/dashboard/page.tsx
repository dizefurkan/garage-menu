import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSessionWithTenant } from "@/lib/auth/session";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getDashboardStats(tenantId: number) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Error handling
          }
        },
      },
    }
  );

  const [productsRes, categoriesRes, teamRes] = await Promise.all([
    supabase.from("products").select("id").eq("tenant_id", tenantId),
    supabase.from("categories").select("id").eq("tenant_id", tenantId),
    supabase.from("tenant_users").select("id").eq("tenant_id", tenantId),
  ]);

  return {
    productsCount: productsRes.data?.length || 0,
    categoriesCount: categoriesRes.data?.length || 0,
    teamCount: teamRes.data?.length || 0,
  };
}

export default async function DashboardPage() {
  const { user, tenant, role } = await getSessionWithTenant();
  const t = await getTranslations("dashboard");

  if (!user || !tenant) {
    redirect("/auth/login");
  }

  const stats = await getDashboardStats(tenant.id);
  const userName = user.email?.split("@")[0] || "User";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {t("welcome", { name: userName })}
        </h1>
        <p className="text-sm text-foreground/60">
          {t("description")}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="border-foreground/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium tracking-tight text-foreground/70">
              {t("products_title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.productsCount}</div>
            <p className="text-xs text-foreground/50 mt-1">
              {stats.productsCount === 1 ? t("product_one") : t("product_many")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-foreground/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium tracking-tight text-foreground/70">
              {t("categories_title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">
              {stats.categoriesCount}
            </div>
            <p className="text-xs text-foreground/50 mt-1">
              {stats.categoriesCount === 1 ? t("category_one") : t("category_many")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-foreground/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium tracking-tight text-foreground/70">
              {t("team_title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{stats.teamCount}</div>
            <p className="text-xs text-foreground/50 mt-1">
              {stats.teamCount === 1 ? t("member_one") : t("member_many")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-foreground/5">
        <CardHeader>
          <CardTitle className="text-base">Getting Started</CardTitle>
          <CardDescription className="text-xs">
            Common tasks to get you started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {(role === "owner" || role === "editor") && (
              <>
                <Link href="/admin/products/new">
                  <Button size="sm" className="w-full">
                    + Add Product
                  </Button>
                </Link>

                <Link href="/admin/categories">
                  <Button size="sm" variant="outline" className="w-full">
                    Categories
                  </Button>
                </Link>
              </>
            )}

            {role === "owner" && (
              <Link href="/admin/team">
                <Button size="sm" variant="outline" className="w-full">
                  Team
                </Button>
              </Link>
            )}

            <Link href={`/${tenant.slug}/en`} target="_blank">
              <Button size="sm" variant="outline" className="w-full">
                Preview Menu
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
