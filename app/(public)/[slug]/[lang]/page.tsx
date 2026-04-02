import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{
    slug: string;
    lang: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  const baseUrl = 'https://garage-menu.vercel.app';

  return {
    title: `Menu | ${slug}`,
    description: 'Browse our menu',
    alternates: {
      canonical: `${baseUrl}/${slug}/${lang}`,
      languages: {
        en: `${baseUrl}/${slug}/en`,
        tr: `${baseUrl}/${slug}/tr`,
      },
    },
  };
}

async function getTenantData(slug: string) {
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

  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !tenant) {
    return null;
  }

  return tenant;
}

async function getMenuData(tenantId: number, language: string) {
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

  // Use RPC to get published categories and products
  const { data: categories } = await supabase.rpc(
    'categories_with_translations',
    { p_tenant_id: tenantId }
  );

  const { data: products } = await supabase.rpc(
    'products_with_translations',
    { p_tenant_id: tenantId }
  );

  return { categories: categories || [], products: products || [] };
}

export default async function MenuPage({ params }: Props) {
  const { slug, lang } = await params;

  // Validate language
  if (!['en', 'tr'].includes(lang)) {
    notFound();
  }

  // Get tenant
  const tenant = await getTenantData(slug);
  if (!tenant) {
    notFound();
  }

  // Get menu data
  const { categories, products } = await getMenuData(tenant.id, lang);

  // Apply theme
  const theme = tenant.theme_config as any || {};
  const themeStyle = `
    --color-primary: ${theme.primary || '#000000'};
    --color-secondary: ${theme.secondary || '#FFFFFF'};
  `;

  return (
    <div style={{ '--color-primary': theme.primary || '#000000', '--color-secondary': theme.secondary || '#FFFFFF' } as React.CSSProperties}>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="border-b">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                {tenant.logo_url && (
                  <img
                    src={tenant.logo_url}
                    alt={tenant.name}
                    className="h-12 w-auto"
                  />
                )}
                <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
                {tenant.description && (
                  <p className="mt-1 text-gray-600">{tenant.description}</p>
                )}
              </div>

              {/* Language Switcher */}
              <div className="flex gap-2">
                {tenant.languages?.map((language: string) => (
                  <a
                    key={language}
                    href={`/${slug}/${language}`}
                    className={`px-3 py-2 text-sm font-medium ${
                      lang === language
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {language.toUpperCase()}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </header>

        {/* Menu Content */}
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {categories.length === 0 ? (
            <div className="text-center">
              <p className="text-gray-600">Menu coming soon</p>
            </div>
          ) : (
            <Suspense fallback={<div>Loading menu...</div>}>
              {categories.map((category: any) => {
                const categoryProducts = products.filter(
                  (p: any) => p.category_id === category.id
                );

                if (categoryProducts.length === 0) return null;

                const categoryName = category.translations?.[lang]?.name || 'Unknown';

                return (
                  <section key={category.id} className="mb-12">
                    <h2 className="mb-6 text-2xl font-bold text-gray-900">
                      {categoryName}
                    </h2>
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                      {categoryProducts.map((product: any) => {
                        const productData = product.translations?.[lang];
                        if (!productData) return null;

                        return (
                          <div
                            key={product.id}
                            className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
                          >
                            {product.image_url && (
                              <img
                                src={product.image_url}
                                alt={productData.name}
                                className="aspect-video w-full object-cover"
                              />
                            )}
                            <div className="p-4">
                              <h3 className="font-semibold text-gray-900">
                                {productData.name}
                              </h3>
                              {productData.description && (
                                <p className="mt-2 text-sm text-gray-600">
                                  {productData.description}
                                </p>
                              )}
                              <div className="mt-4 flex items-center justify-between">
                                <span className="text-lg font-bold text-gray-900">
                                  {product.price} {product.currency}
                                </span>
                                {!product.is_available && (
                                  <span className="text-xs font-medium text-gray-500">
                                    Unavailable
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </Suspense>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t bg-gray-50 py-8">
          <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-600 sm:px-6 lg:px-8">
            <p>{tenant.name}</p>
            {tenant.phone && <p>{tenant.phone}</p>}
            {tenant.email && <p>{tenant.email}</p>}
          </div>
        </footer>
      </div>
    </div>
  );
}
