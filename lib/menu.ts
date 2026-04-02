import fallbackMenuJson from "@/data/menu.json";

export type SupportedLocale = "tr" | "en";

export type LocalizedText = Record<SupportedLocale, string>;

export type MenuRestaurant = {
  name: string;
  currency: string;
  languages: SupportedLocale[];
};

export type MenuCategory = {
  id: number;
  slug: string;
  order: number;
  name: LocalizedText;
};

export type MenuProduct = {
  id: number;
  categoryId: number;
  imageId?: string;
  imageUrl?: string;
  imagePath?: string;
  price: number;
  name: LocalizedText;
  description: LocalizedText;
};

export type MenuData = {
  restaurant: MenuRestaurant;
  categories: MenuCategory[];
  products: MenuProduct[];
};

export const fallbackMenuData = fallbackMenuJson as MenuData;

function isLocalizedText(value: unknown): value is LocalizedText {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<LocalizedText>;
  return typeof record.tr === "string" && typeof record.en === "string";
}

function isMenuRestaurant(value: unknown): value is MenuRestaurant {
  if (!value || typeof value !== "object") {
    return false;
  }

  const restaurant = value as Partial<MenuRestaurant>;

  return (
    typeof restaurant.name === "string" &&
    typeof restaurant.currency === "string" &&
    Array.isArray(restaurant.languages) &&
    restaurant.languages.every(
      (language) => language === "tr" || language === "en"
    )
  );
}

function isMenuCategory(value: unknown): value is MenuCategory {
  if (!value || typeof value !== "object") {
    return false;
  }

  const category = value as Partial<MenuCategory>;

  return (
    typeof category.id === "number" &&
    typeof category.slug === "string" &&
    typeof category.order === "number" &&
    isLocalizedText(category.name)
  );
}

function isMenuProduct(value: unknown): value is MenuProduct {
  if (!value || typeof value !== "object") {
    return false;
  }

  const product = value as Partial<MenuProduct>;

  return (
    typeof product.id === "number" &&
    typeof product.categoryId === "number" &&
    (product.imageId === undefined || typeof product.imageId === "string") &&
    (product.imageUrl === undefined || typeof product.imageUrl === "string") &&
    (product.imagePath === undefined ||
      typeof product.imagePath === "string") &&
    typeof product.price === "number" &&
    isLocalizedText(product.name) &&
    isLocalizedText(product.description)
  );
}

export function isMenuData(value: unknown): value is MenuData {
  if (!value || typeof value !== "object") {
    return false;
  }

  const menu = value as Partial<MenuData>;

  return (
    isMenuRestaurant(menu.restaurant) &&
    Array.isArray(menu.categories) &&
    menu.categories.every(isMenuCategory) &&
    Array.isArray(menu.products) &&
    menu.products.every(isMenuProduct)
  );
}
