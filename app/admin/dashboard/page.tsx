import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getSessionWithTenant } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
    supabase.from('products').select('id').eq('tenant_id', tenantId),
    supabase.from('categories').select('id').eq('tenant_id', tenantId),
    supabase.from('tenant_users').select('id').eq('tenant_id', tenantId),
  ]);

  return {
    productsCount: productsRes.data?.length || 0,
    categoriesCount: categoriesRes.data?.length || 0,
    teamCount: teamRes.data?.length || 0,
  };
}

export default async function DashboardPage() {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant) {
    redirect('/auth/login');
  }

  const stats = await getDashboardStats(tenant.id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Welcome back, {user.email?.split('@')[0]}!
        </h1>
        <p className="mt-2 text-gray-600">
          Manage your restaurant menu and team
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.productsCount}</div>
            <p className="mt-1 text-xs text-gray-500">
              Total products in menu
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.categoriesCount}</div>
            <p className="mt-1 text-xs text-gray-500">
              Menu categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Team Members
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.teamCount}</div>
            <p className="mt-1 text-xs text-gray-500">
              Collaborators
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common management tasks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {(role === 'owner' || role === 'editor') && (
              <>
                <Link href="/admin/products/new">
                  <Button className="w-full">
                    Add Product
                  </Button>
                </Link>

                <Link href="/admin/categories">
                  <Button variant="outline" className="w-full">
                    Manage Categories
                  </Button>
                </Link>
              </>
            )}

            <Link href={`/${tenant.slug}/en`} target="_blank">
              <Button variant="outline" className="w-full">
                View Public Menu
              </Button>
            </Link>

            {role === 'owner' && (
              <Link href="/admin/team">
                <Button variant="outline" className="w-full">
                  Manage Team
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>
            ✓ Your menu is live at: <code className="bg-gray-100 px-2 py-1 rounded">/{tenant.slug}/en</code>
          </p>
          <p>
            ✓ Add products to make your menu visible
          </p>
          <p>
            ✓ Support for multi-language (EN, TR)
          </p>
          {role === 'owner' && (
            <p>
              ✓ <Link href="/admin/team" className="text-blue-600 hover:text-blue-700">Invite team members</Link> to help manage your menu
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
          href="/admin/products"
        />
        <StatCard
          title="Categories"
          value="TBD"
          description="Menu sections"
          href="/admin/categories"
        />
        <StatCard
          title="Team Members"
          value="TBD"
          description="Collaborators"
          href="/admin/team"
        />
      </div>

      {/* Quick Actions Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recent">Recent Activity</TabsTrigger>
          <TabsTrigger value="quick-actions">Quick Actions</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drafts</CardTitle>
              <CardDescription>
                Unpublished changes waiting to go live
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8 text-gray-500">
              <p>No drafts yet</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Activity Tab */}
        <TabsContent value="recent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest changes in your menu</CardDescription>
            </CardHeader>
            <CardContent className="text-center py-8 text-gray-500">
              <p>No recent activity</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Quick Actions Tab */}
        <TabsContent value="quick-actions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Add New Product</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => router.push("/admin/products/new")}
                >
                  Create Product
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Add Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  onClick={() => router.push("/admin/categories/new")}
                >
                  Create Category
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Invite Team Member</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push("/admin/invites")}
                >
                  Send Invite
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition cursor-pointer">
              <CardHeader>
                <CardTitle className="text-base">Customize Theme</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => router.push("/admin/settings")}
                >
                  Edit Theme
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
function StatCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: string;
  description: string;
  href: string;
}) {
  const router = useRouter();

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition"
      onClick={() => router.push(href)}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}
