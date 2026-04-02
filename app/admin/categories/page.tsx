import { getSessionWithTenant } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

async function getCategories(tenantId: number) {
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
          } catch {}
        },
      },
    }
  );

  const { data } = await supabase
    .from('categories')
    .select(
      `
      id,
      created_at,
      is_draft,
      display_order,
      category_translations(name, language_code)
    `
    )
    .eq('tenant_id', tenantId)
    .order('display_order');

  return data || [];
}

export default async function CategoriesPage() {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || (role !== 'owner' && role !== 'editor')) {
    redirect('/admin/dashboard');
  }

  const categories = await getCategories(tenant.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="mt-2 text-gray-600">Organize your menu</p>
        </div>
        <Link href="/admin/categories/new">
          <Button>+ Add Category</Button>
        </Link>
      </div>

      {categories.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No categories yet.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              {categories.map((category: any) => {
                const enName = category.category_translations?.find(
                  (t: any) => t.language_code === 'en'
                )?.name || 'N/A';

                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between rounded border p-3 hover:bg-gray-50"
                  >
                    <div>
                      <p className="font-medium">{enName}</p>
                      <p className="text-sm text-gray-500">
                        {category.is_draft ? 'Draft' : 'Published'}
                      </p>
                    </div>
                    <Link href={`/admin/categories/${category.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </Link>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
