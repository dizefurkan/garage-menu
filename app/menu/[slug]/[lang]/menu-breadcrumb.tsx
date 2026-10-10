import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { MarqueeText } from "./marquee-text";

export interface BreadcrumbItem {
  label: string;
  /** Show a home icon instead of the text (label stays as the accessible name). */
  home?: boolean;
  href: string;
}

const BREADCRUMB_LABELS: Record<string, string> = {
  tr: "Gezinti yolu",
  en: "Breadcrumb",
  de: "Brotkrumennavigation",
  fr: "Fil d'Ariane",
  es: "Ruta de navegación",
  ru: "Навигационная цепочка",
  ar: "مسار التنقل",
  zh: "面包屑导航",
};

/**
 * Trail of ancestors for the category-first menu: home icon › Breakfast.
 *
 * It deliberately stops at the parent: the category being viewed is already
 * the title right above its products, so repeating it here would only add
 * noise. Every item is a link, so one tap jumps any number of levels up. When
 * the only ancestor is the root, the home icon carries its label so the bar
 * still reads as a way back.
 *
 * Sticky, fixed 44px high (h-11) so the category title can stick right under
 * it (see --menu-sticky in the menu page). Rows stay on one line: names that
 * do not fit glide to the end and back (MarqueeText).
 */
export function MenuBreadcrumb({
  items,
  lang,
}: {
  items: BreadcrumbItem[];
  lang: string;
}) {
  if (items.length === 0) return null;

  return (
    <nav
      aria-label={BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.en}
      // Only the root: on mobile the tab bar's Home tab covers it, so the bar
      // would just spend 44px; desktop has no tab bar and keeps it
      className={`sticky top-0 z-30 h-11 border-b border-gray-100 bg-white ${
        items.length === 1 ? "max-md:hidden" : ""
      }`}
    >
      <ol className="mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const labelledHome = item.home && items.length === 1;

          return (
            <li
              key={`${index}-${item.label}`}
              className={`flex h-full items-center ${
                item.home && !labelledHome
                  ? "shrink-0"
                  : "min-w-0 max-w-[60%] shrink"
              }`}
            >
              <Link
                href={item.href}
                scroll={false}
                aria-label={item.home ? item.label : undefined}
                className={`flex h-full min-w-0 items-center gap-1.5 text-gray-600 transition-colors hover:text-gray-900 ${
                  item.home ? "min-w-11" : "underline-offset-4 hover:underline"
                }`}
              >
                {item.home ? (
                  <>
                    <Home className="size-4 shrink-0" aria-hidden />
                    {labelledHome && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </>
                ) : (
                  <MarqueeText>{item.label}</MarqueeText>
                )}
              </Link>
              {!isLast && (
                <ChevronRight
                  className="mx-1.5 size-4 shrink-0 text-gray-300 rtl:rotate-180"
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
