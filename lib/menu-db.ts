import { supabase } from "./supabase";
import type { MenuData, SupportedLocale } from "./menu";

const SUPPORTED_LANGUAGES = ["tr", "en"] as const satisfies SupportedLocale[];

type TranslatedCategory = {
  id: number;
  category_translations: Array<{
    language_code: string;
    name: string;
  }>;
};

type TranslatedProduct = {
  id: number;
  category_id: number;
  price: number;
  image_url: string | null;
  product_translations: Array<{
    language_code: string;
    name: string;
    description: string;
  }>;
};

/**
 * Fetch menu data from Supabase with translations
 */
export async function getMenuFromDatabase(): Promise<MenuData> {
  try {
    // Fetch categories with translations
    const { data: categoriesData, error: categoriesError } = await supabase
      .from("categories")
      .select(
        `
        id,
        category_translations(language_code, name)
      `
      )
      .order("id");

    if (categoriesError) {
      throw new Error(`Failed to fetch categories: ${categoriesError.message}`);
    }

    // Fetch products with translations
    const { data: productsData, error: productsError } = await supabase
      .from("products")
      .select(
        `
        id,
        category_id,
        price,
        image_url,
        product_translations(language_code, name, description)
      `
      )
      .order("id");

    if (productsError) {
      throw new Error(`Failed to fetch products: ${productsError.message}`);
    }

    // Transform categories
    const categories =
      (categoriesData as TranslatedCategory[])?.map((cat, idx) => {
        const nameMap: Record<string, string> = {};
        cat.category_translations.forEach((t) => {
          nameMap[t.language_code] = t.name;
        });

        return {
          id: cat.id,
          slug: `category-${cat.id}`,
          order: idx,
          name: {
            tr: nameMap.tr || "",
            en: nameMap.en || "",
          },
        };
      }) || [];

    // Transform products
    const products =
      (productsData as TranslatedProduct[])?.map((prod) => {
        const transMap: Record<string, { name: string; description: string }> =
          {};
        prod.product_translations.forEach((t) => {
          transMap[t.language_code] = {
            name: t.name,
            description: t.description,
          };
        });

        return {
          id: prod.id,
          categoryId: prod.category_id,
          name: {
            tr: transMap.tr?.name || "",
            en: transMap.en?.name || "",
          },
          description: {
            tr: transMap.tr?.description || "",
            en: transMap.en?.description || "",
          },
          price: prod.price,
          imageId: prod.image_url || undefined,
        };
      }) || [];

    return {
      restaurant: {
        name: "Garage Menu",
        currency: "TRY",
        languages: SUPPORTED_LANGUAGES,
      },
      categories,
      products,
    };
  } catch (error) {
    console.error("Error fetching menu from database:", error);
    throw error;
  }
}

/**
 * Get public URL for an image in Supabase Storage
 */
export function getImagePublicUrl(imagePath: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl || !imagePath) {
    return "";
  }
  return `${supabaseUrl}/storage/v1/object/public/product-images/${imagePath}`;
}
