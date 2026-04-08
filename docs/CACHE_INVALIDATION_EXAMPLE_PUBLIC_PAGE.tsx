/**
 * Example Public Menu Page
 *
 * This demonstrates:
 * - Fetching cached data with tenant tags
 * - Automatic revalidation when tenant data updates
 * - Multi-language support
 *
 * Adapt this pattern for any public-facing page that needs cached data
 */

import { notFound } from "next/navigation";
import {
  getPublicMenu,
  getPublicCategories,
  getPublicProducts,
  getPublicMenuConfig,
  getPublicContactInfo,
} from "@/lib/db/cached-queries";

interface MenuPageProps {
  params: {
    slug: string;
    lang?: string;
  };
}

/**
 * Public menu page
 *
 * All data is fetched with tenant-specific cache tags (granular):
 * - getPublicMenu() uses: tenant:{slug}
 * - getPublicCategories() uses: tenant:{slug}, tenant:{slug}:categories
 * - getPublicProducts() uses: tenant:{slug}, tenant:{slug}:products
 * - getPublicMenuConfig() uses: tenant:{slug}, tenant:{slug}:settings
 * - getPublicContactInfo() uses: tenant:{slug}
 *
 * When ANY data for this tenant is updated via admin, these caches
 * are revalidated automatically (on NEXT request).
 */
export default async function MenuPage({ params }: MenuPageProps) {
  const { slug, lang = "en" } = params;

  // Validate slug
  if (!slug || typeof slug !== "string") {
    notFound();
  }

  try {
    // Fetch all tenant data in parallel
    // Each call is tagged with tenant-{slug}
    // All will be revalidated together when tenant data updates
    const [menu, categories, products, config, contact] = await Promise.all([
      getPublicMenu(slug, lang).catch((e) => {
        console.error(`Failed to fetch menu for ${slug}:`, e);
        return null;
      }),
      getPublicCategories(slug, lang).catch((e) => {
        console.error(`Failed to fetch categories for ${slug}:`, e);
        return [];
      }),
      getPublicProducts(slug, lang).catch((e) => {
        console.error(`Failed to fetch products for ${slug}:`, e);
        return [];
      }),
      getPublicMenuConfig(slug).catch((e) => {
        console.error(`Failed to fetch config for ${slug}:`, e);
        return null;
      }),
      getPublicContactInfo(slug).catch((e) => {
        console.error(`Failed to fetch contact info for ${slug}:`, e);
        return null;
      }),
    ]);

    // If menu not found, return 404
    if (!menu) {
      notFound();
    }

    // Apply theme configuration
    const themeConfig = config?.theme_config || {
      primary: "#000000",
      secondary: "#ffffff",
    };

    return (
      <div
        style={
          {
            "--primary-color": themeConfig.primary,
            "--secondary-color": themeConfig.secondary,
          } as React.CSSProperties
        }
      >
        <header>
          <h1>{menu.name}</h1>
          {menu.description && <p>{menu.description}</p>}
        </header>

        {/* Main content area */}
        <main>
          {categories && categories.length > 0 ? (
            <section>
              <h2>Menu</h2>
              {categories.map((category: any) => (
                <CategorySection
                  key={category.id}
                  category={category}
                  products={products.filter(
                    (p: any) => p.category_id === category.id
                  )}
                />
              ))}
            </section>
          ) : (
            <p>No categories available</p>
          )}
        </main>

        {/* Contact information */}
        {contact && (
          <footer>
            <h3>Contact</h3>
            {contact.address && <p>Address: {contact.address}</p>}
            {contact.phone && <p>Phone: {contact.phone}</p>}
            {contact.email && <p>Email: {contact.email}</p>}
            {contact.whatsapp && <p>WhatsApp: {contact.whatsapp}</p>}
          </footer>
        )}
      </div>
    );
  } catch (error) {
    console.error(`[Menu Page] Error loading menu for ${slug}:`, error);
    notFound();
  }
}

/**
 * Category section component
 */
function CategorySection({
  category,
  products,
}: {
  category: any;
  products: any[];
}) {
  return (
    <div key={category.id} className="category-section">
      <h3>{category.name}</h3>
      {category.description && <p>{category.description}</p>}

      {products && products.length > 0 ? (
        <div className="products-list">
          {products.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p>No products in this category</p>
      )}
    </div>
  );
}

/**
 * Product card component
 */
function ProductCard({ product }: { product: any }) {
  return (
    <div key={product.id} className="product-card">
      {product.image_url && <img src={product.image_url} alt={product.name} />}
      <h4>{product.name}</h4>
      {product.description && <p>{product.description}</p>}
      <p className="price">
        {product.price} {product.currency}
      </p>
      {!product.is_available && <span className="badge">Not Available</span>}
    </div>
  );
}

/**
 * Metadata generation for SEO
 *
 * This would typically call the same data fetching functions
 */
export async function generateMetadata({ params }: MenuPageProps) {
  const { slug, lang = "en" } = params;

  try {
    const menu = await getPublicMenu(slug, lang);

    return {
      title: menu?.name || "Menu",
      description: menu?.description || "Digital Menu",
    };
  } catch {
    return {
      title: "Menu",
      description: "Digital Menu",
    };
  }
}

/**
 * Static params for pre-rendering popular restaurants
 * Adjust based on your needs
 */
export async function generateStaticParams() {
  // Example: fetch top restaurants to pre-render their menu pages
  // This is optional - you can use ISR (Incremental Static Regeneration)
  return [];
}
