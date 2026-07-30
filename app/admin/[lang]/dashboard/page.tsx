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
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { hasAddon } from "@/lib/licensing/hasAddon";
import { supabaseAdmin } from "@/lib/supabase";

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

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Load messages for this locale
  const messages = (await import(`@/messages/${lang}.json`)).default;
  const dashboardMessages = messages.dashboard || {};

  const t = (key: string, replacements?: Record<string, string | number>) => {
    const value = dashboardMessages[key as keyof typeof dashboardMessages];

    if (typeof value !== "string") {
      return key;
    }

    // Simple replacement for placeholders like {name}
    if (replacements) {
      return Object.entries(replacements).reduce(
        (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
        value
      );
    }
    return value;
  };

  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant) {
    redirect("/auth/login");
  }

  const stats = await getDashboardStats(tenant.id);
  const userName = user.email?.split("@")[0] || "User";

  // Ordering off is a quiet state — nothing else in the panel shows it, so a
  // venue can leave it closed by accident and silently take no orders. Only
  // meaningful for venues that actually licensed ordering.
  const ordersLicensed = await hasAddon(
    tenant,
    "orders_management",
    supabaseAdmin
  );
  const qrOrderingOn = tenant.qr_ordering_enabled !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("welcome", { name: userName })}
          </h1>
          <p className="text-sm text-foreground/60">{t("description")}</p>
        </div>

        {ordersLicensed && (
          <Link
            href={`/admin/${lang}/orders/settings`}
            className="flex items-center gap-2 rounded-full border border-foreground/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-accent"
          >
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                qrOrderingOn ? "bg-emerald-500" : "bg-foreground/30"
              }`}
            />
            <span className={qrOrderingOn ? "" : "text-foreground/60"}>
              {qrOrderingOn ? t("qrOrderingOn") : t("qrOrderingOff")}
            </span>
          </Link>
        )}
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
              {stats.categoriesCount === 1
                ? t("category_one")
                : t("category_many")}
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
