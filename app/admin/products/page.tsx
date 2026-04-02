import { getSessionWithTenant } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

async function getProducts(tenantId: number) {
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
    .from('products')
    .select(
      `
      id,
      created_at,
      updated_at,
      price,
      currency,
      is_draft,
      is_available,
      category_id,
      product_translations(name, language_code),
      categories(name)
    `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  return data || [];
}

export default async function ProductsPage() {
  const { user, tenant, role } = await getSessionWithTenant();

  if (!user || !tenant || (role !== 'owner' && role !== 'editor')) {
    redirect('/admin/dashboard');
  }

  const products = await getProducts(tenant.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="mt-2 text-gray-600">Manage your menu products</p>
        </div>
        <Link href="/admin/products/new">
          <Button>+ Add Product</Button>
        </Link>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-gray-600">No products yet. Create your first product to get started.</p>
            <Link href="/admin/products/new" className="mt-4">
              <Button>Create Product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="px-4 py-2 text-left font-semibold">Name</th>
                    <th className="px-4 py-2 text-left font-semibold">Price</th>
                    <th className="px-4 py-2 text-left font-semibold">Category</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product: any) => {
                    const enName = product.product_translations?.find(
                      (t: any) => t.language_code === 'en'
                    )?.name || 'N/A';

                    return (
                      <tr key={product.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">{enName}</td>
                        <td className="px-4 py-3">
                          {product.price} {product.currency}
                        </td>
                        <td className="px-4 py-3">{product.categories?.name || '-'}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              product.is_draft
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {product.is_draft ? 'Draft' : 'Published'}
                          </span>
                          {!product.is_available && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              Unavailable
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
