import Link from "next/link";
import { ChevronRight } from "lucide-react";

const PRODUCT_COUNT_LABELS: Record<string, (n: number) => string> = {
  tr: (n) => `${n} ürün`,
  en: (n) => `${n} item${n === 1 ? "" : "s"}`,
  de: (n) => `${n} Artikel`,
  fr: (n) => `${n} produit${n === 1 ? "" : "s"}`,
  es: (n) => `${n} producto${n === 1 ? "" : "s"}`,
  ru: (n) => `${n} поз.`,
  ar: (n) => `${n} صنف`,
  zh: (n) => `${n} 项`,
};

interface Category {
  id: number | string;
  name: string;
  image: string | null;
  productCount: number;
}

interface CategoryLandingProps {
  categories: Category[];
  lang: string;
  /** Preserved across navigation so ordering survives the drill-down. */
  tableId?: string;
  primaryColor: string;
}

/**
 * Category-first entry screen, shown when the venue picks the "categories"
 * menu layout. One category per row, wide banner, tap to drill into products.
 *
 * The public menu does not sit under NextIntlClientProvider, so the small
 * amount of copy here follows the same per-language map pattern the rest of
 * this route already uses for allergen and close labels.
 */
export function CategoryLanding({
  categories,
  lang,
  tableId,
  primaryColor,
}: CategoryLandingProps) {
  const countLabel = PRODUCT_COUNT_LABELS[lang] || PRODUCT_COUNT_LABELS.en;

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const href = `?category=${category.id}${
          tableId ? `&tableId=${tableId}` : ""
        }`;

        return (
          <Link
            key={category.id}
            href={href}
            scroll={false}
            className="group block overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
          >
            {/* Deliberately ultra-wide: a 21:9 band reads as a section banner
                rather than competing with the square product photos below. */}
            {category.image ? (
              <div className="relative aspect-[21/9] w-full overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={category.image}
                  alt=""
                  className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              </div>
            ) : (
              // Fallback for venues that enabled this layout without uploading
              // images — a flat tinted band, never a broken frame.
              <div
                className="aspect-[21/9] w-full opacity-10"
                style={{ backgroundColor: primaryColor }}
                aria-hidden
              />
            )}

            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-gray-900">
                  {category.name}
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  {countLabel(category.productCount)}
                </p>
              </div>
              <ChevronRight
                className="size-5 shrink-0 text-gray-400 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
