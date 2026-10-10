"use client";

import { useEffect, useState } from "react";
import { Globe, LayoutGrid, ShoppingBag } from "lucide-react";
import { getLanguageFlag } from "@/lib/language-flags";
import { useCart } from "./cart-context";
import {
  MobileCategoryDrawer,
  type DrawerCategory,
} from "./mobile-category-drawer";

const LABELS: Record<string, { categories: string; language: string; cart: string }> = {
  tr: { categories: "Kategoriler", language: "Dil", cart: "Sepetim" },
  en: { categories: "Categories", language: "Language", cart: "Cart" },
  de: { categories: "Kategorien", language: "Sprache", cart: "Warenkorb" },
  fr: { categories: "Catégories", language: "Langue", cart: "Panier" },
  es: { categories: "Categorías", language: "Idioma", cart: "Carrito" },
  ru: { categories: "Категории", language: "Язык", cart: "Корзина" },
  ar: { categories: "الفئات", language: "اللغة", cart: "السلة" },
  zh: { categories: "分类", language: "语言", cart: "购物车" },
};

function languageLabel(code: string): string {
  try {
    const base = code.toLowerCase().split("-")[0];
    return (
      new Intl.DisplayNames([code.toLowerCase()], { type: "language" }).of(
        base
      ) || code.toUpperCase()
    );
  } catch {
    return code.toUpperCase();
  }
}

/**
 * Mobile bottom tab bar, the way native apps do it: Categories (opens the
 * drawer), Language (a small list above the bar) and Cart (opens the existing
 * cart sheet). A tab only exists when its feature does. Replaces the floating
 * buttons that crowded the corners and collided with sticky bars.
 */
export function MobileTabBar({
  lang,
  slug,
  title,
  primaryColor,
  categories,
  categoryNavigate,
  tableId,
  activeId,
  menuLanguages,
  showCategories,
  showCart,
}: {
  lang: string;
  slug: string;
  /** Root crumb label, used as the drawer title */
  title: string;
  primaryColor: string;
  categories: DrawerCategory[];
  categoryNavigate: boolean;
  tableId?: string;
  activeId?: number | string;
  menuLanguages: string[];
  showCategories: boolean;
  showCart: boolean;
}) {
  const labels = LABELS[lang] || LABELS.en;
  const { cart, openCart, isOpen: cartOpen } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const showLanguage = menuLanguages.length >= 2;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!langOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLangOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [langOpen]);

  if (!showCategories && !showLanguage && !showCart) return null;

  const tab =
    "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors active:bg-gray-50";

  return (
    <>
      {showCategories && (
        <MobileCategoryDrawer
          categories={categories}
          title={title}
          lang={lang}
          navigate={categoryNavigate}
          tableId={tableId}
          activeId={activeId}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      )}

      {langOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setLangOpen(false)}
          aria-hidden
        />
      )}

      <nav
        aria-label={labels.categories}
        className="fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-100 bg-white/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-1px_8px_rgba(0,0,0,0.04)] backdrop-blur md:hidden"
      >
        {showCategories && (
          <button
            type="button"
            onClick={() => {
              setLangOpen(false);
              setDrawerOpen(true);
            }}
            aria-haspopup="dialog"
            className={`${tab} ${drawerOpen ? "" : "text-gray-500"}`}
            style={drawerOpen ? { color: primaryColor } : undefined}
          >
            <LayoutGrid className="size-5" aria-hidden />
            {labels.categories}
          </button>
        )}

        {showLanguage && (
          <div className="relative flex flex-1">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={langOpen}
              className={`${tab} ${langOpen ? "" : "text-gray-500"}`}
              style={langOpen ? { color: primaryColor } : undefined}
            >
              <Globe className="size-5" aria-hidden />
              {labels.language}
            </button>
            {langOpen && (
              <ul
                role="listbox"
                className="absolute bottom-full left-1/2 z-50 mb-2 min-w-44 -translate-x-1/2 space-y-1 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl"
              >
                {menuLanguages.map((code) => (
                  <li key={code} role="option" aria-selected={code === lang}>
                    <a
                      href={`/menu/${slug}/${code}`}
                      className={`flex min-h-11 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors ${
                        code === lang
                          ? "bg-gray-100 text-black"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-base leading-none">
                        {getLanguageFlag(code)}
                      </span>
                      <span>{languageLabel(code)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {showCart && (
          <button
            type="button"
            onClick={() => {
              setLangOpen(false);
              openCart();
            }}
            className={`${tab} ${cartOpen ? "" : "text-gray-500"}`}
            style={cartOpen ? { color: primaryColor } : undefined}
          >
            <span className="relative">
              <ShoppingBag className="size-5" aria-hidden />
              {itemCount > 0 && (
                <span
                  className="absolute -right-2.5 -top-1.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-4 text-white"
                  style={{ backgroundColor: primaryColor }}
                >
                  {itemCount}
                </span>
              )}
            </span>
            {labels.cart}
          </button>
        )}
      </nav>
    </>
  );
}
