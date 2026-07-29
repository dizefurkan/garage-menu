/**
 * Public-menu ordering.
 *
 * Kept out of the route so the rules are testable and stated once. Every mode
 * falls back to `display_order` then `id` as a tiebreak, so the output is
 * stable — two products with the same name never swap places between renders.
 */

export type CategorySort = "manual" | "alphabetical" | "popularity";
export type ProductSort =
  | "manual"
  | "alphabetical"
  | "popularity"
  | "price_asc"
  | "price_desc"
  | "newest";

interface Sortable {
  id: number | string;
  name: string;
  display_order?: number;
}

interface SortableProduct extends Sortable {
  price?: number;
  created_at?: string;
  out_of_stock?: boolean;
}

/**
 * Locale-aware name comparison.
 *
 * Plain string comparison gets Turkish wrong: `Ç` does not sort right after
 * `C`, dotted/dotless İ/I collate incorrectly, and Ö/Ş/Ü land in the wrong
 * places. `localeCompare` with the active language fixes all of it, and since
 * category names are per-language the comparison has to happen after the
 * translation is resolved — which is why this runs in JS rather than SQL.
 */
function compareNames(a: string, b: string, lang: string): number {
  return (a || "").localeCompare(b || "", lang, { sensitivity: "base" });
}

function tiebreak(a: Sortable, b: Sortable): number {
  const orderDiff = (a.display_order ?? 0) - (b.display_order ?? 0);
  if (orderDiff !== 0) return orderDiff;
  return String(a.id).localeCompare(String(b.id), undefined, {
    numeric: true,
  });
}

export function sortCategories<T extends Sortable>(
  categories: T[],
  mode: CategorySort,
  lang: string,
  popularity?: Map<string, number>
): T[] {
  const sorted = [...categories];

  switch (mode) {
    case "alphabetical":
      sorted.sort(
        (a, b) => compareNames(a.name, b.name, lang) || tiebreak(a, b)
      );
      break;

    case "popularity":
      // No order data yet (new venue, or ordering never enabled) means every
      // score is 0 and this silently behaves as `manual` — which is the
      // documented fallback, not an accident.
      sorted.sort((a, b) => {
        const diff =
          (popularity?.get(String(b.id)) ?? 0) -
          (popularity?.get(String(a.id)) ?? 0);
        return diff || tiebreak(a, b);
      });
      break;

    case "manual":
    default:
      sorted.sort(tiebreak);
      break;
  }

  return sorted;
}

/**
 * Sold-out items sink to the bottom of their category regardless of the
 * chosen mode. This is a rule laid *over* sorting, not a mode of its own —
 * leading with something the kitchen cannot serve costs an order, whichever
 * way the rest of the list is arranged.
 */
function stockFirst(a: SortableProduct, b: SortableProduct): number {
  return Number(a.out_of_stock ?? false) - Number(b.out_of_stock ?? false);
}

export function sortProducts<T extends SortableProduct>(
  products: T[],
  mode: ProductSort,
  lang: string,
  popularity?: Map<string, number>
): T[] {
  const sorted = [...products];

  switch (mode) {
    case "alphabetical":
      sorted.sort(
        (a, b) =>
          stockFirst(a, b) ||
          compareNames(a.name, b.name, lang) ||
          tiebreak(a, b)
      );
      break;

    case "price_asc":
      sorted.sort(
        (a, b) => stockFirst(a, b) || (a.price ?? 0) - (b.price ?? 0) || tiebreak(a, b)
      );
      break;

    case "price_desc":
      sorted.sort(
        (a, b) => stockFirst(a, b) || (b.price ?? 0) - (a.price ?? 0) || tiebreak(a, b)
      );
      break;

    case "newest":
      sorted.sort((a, b) => {
        const diff =
          new Date(b.created_at ?? 0).getTime() -
          new Date(a.created_at ?? 0).getTime();
        return stockFirst(a, b) || diff || tiebreak(a, b);
      });
      break;

    case "popularity":
      sorted.sort((a, b) => {
        const diff =
          (popularity?.get(String(b.id)) ?? 0) -
          (popularity?.get(String(a.id)) ?? 0);
        return stockFirst(a, b) || diff || tiebreak(a, b);
      });
      break;

    case "manual":
    default:
      sorted.sort((a, b) => stockFirst(a, b) || tiebreak(a, b));
      break;
  }

  return sorted;
}
