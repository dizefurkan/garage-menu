import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { MarqueeText } from "./marquee-text";

export interface BreadcrumbItem {
  label: string;
  /** Show a home icon instead of the text (label stays as the accessible name). */
  home?: boolean;
  /** Omitted on the last item: it is the current page, not a link. */
  href?: string;
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
 * Where-am-I trail for the category-first menu: Categories › Breakfast › Toasts.
 *
 * Every ancestor is a link (so one tap jumps any number of levels up), the
 * last item is plain text marked aria-current. Rows stay on one line: names
 * that do not fit glide to the end and back (MarqueeText), so a long name never
 * wraps the sticky bar into two rows on a phone. Links keep
 * a 44px touch height.
 */
export function MenuBreadcrumb({
  items,
  lang,
}: {
  items: BreadcrumbItem[];
  lang: string;
}) {
  if (items.length < 2) return null;

  return (
    <nav
      aria-label={BREADCRUMB_LABELS[lang] || BREADCRUMB_LABELS.en}
      className="sticky top-0 z-30 border-b border-gray-100 bg-white"
    >
      <ol className="mx-auto flex max-w-7xl items-center px-4 sm:px-6 lg:px-8 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li
              key={`${index}-${item.label}`}
              className={`flex items-center ${
                isLast
                  ? "min-w-0 flex-1"
                  : item.home
                    ? "shrink-0"
                    : "min-w-0 max-w-[45%] shrink"
              }`}
            >
              {isLast || !item.href ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className="min-w-0 py-3 font-semibold text-gray-900"
                >
                  <MarqueeText>{item.label}</MarqueeText>
                </span>
              ) : (
                <Link
                  href={item.href}
                  scroll={false}
                  aria-label={item.home ? item.label : undefined}
                  className={`flex min-h-11 min-w-0 items-center text-gray-500 transition-colors hover:text-gray-900 ${
                    item.home
                      ? "min-w-11 justify-center"
                      : "underline-offset-4 hover:underline"
                  }`}
                >
                  {item.home ? (
                    <Home className="size-4" aria-hidden />
                  ) : (
                    <MarqueeText>{item.label}</MarqueeText>
                  )}
                </Link>
              )}
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
