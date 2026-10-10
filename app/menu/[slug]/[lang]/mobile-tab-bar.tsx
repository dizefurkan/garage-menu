"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Globe, House, LayoutGrid, ShoppingBag } from "lucide-react";
import { getLanguageFlag } from "@/lib/language-flags";
import { rememberMenuLanguage } from "@/lib/menu-language";
import { BottomSheet } from "./bottom-sheet";
import { useCart } from "./cart-context";
import {
  MobileCategoryDrawer,
  type DrawerCategory,
} from "./mobile-category-drawer";

const LABELS: Record<
  string,
  { home: string; categories: string; language: string; cart: string }
> = {
  tr: { home: "Ana sayfa", categories: "Kategoriler", language: "Dil", cart: "Sepetim" },
  en: { home: "Home", categories: "Categories", language: "Language", cart: "Cart" },
  de: { home: "Start", categories: "Kategorien", language: "Sprache", cart: "Warenkorb" },
  fr: { home: "Accueil", categories: "Catégories", language: "Langue", cart: "Panier" },
  es: { home: "Inicio", categories: "Categorías", language: "Idioma", cart: "Carrito" },
  ru: { home: "Главная", categories: "Категории", language: "Язык", cart: "Корзина" },
  ar: { home: "الرئيسية", categories: "الفئات", language: "اللغة", cart: "السلة" },
  zh: { home: "首页", categories: "分类", language: "语言", cart: "购物车" },
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
 * Mobile bottom tab bar in the iOS style: a floating, frosted capsule inset
 * from the screen edges, with the active tab marked by a soft tinted pill.
 * Tabs: Home (the root category screen), Categories (opens the sheet), Language
 * (a language sheet) and Cart (opens the existing cart sheet). A tab only exists when its feature does. Replaces the floating
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
  showHome,
  homeHref,
  homeActive,
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
  /** Category-first layout only: a way back to the root category screen */
  showHome: boolean;
  homeHref: string;
  homeActive: boolean;
}) {
  const labels = LABELS[lang] || LABELS.en;
  const { cart, openCart, isOpen: cartOpen } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const showLanguage = menuLanguages.length >= 2;
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!showHome && !showCategories && !showLanguage && !showCart) return null;

  const tab =
    "relative flex min-h-12 min-w-16 flex-col items-center justify-center gap-0.5 rounded-[22px] px-3 text-[10px] font-medium transition-colors duration-200 active:scale-95";
  // Active tab: brand colour text on a 12% tint of it
  const activeStyle = {
    color: primaryColor,
    backgroundColor: `color-mix(in srgb, ${primaryColor} 12%, transparent)`,
  };

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

      {showLanguage && (
        <BottomSheet
          open={langOpen}
          onClose={() => setLangOpen(false)}
          label={labels.language}
        >
          <div className="px-4 pb-4 pt-1">
            <h2 className="px-3 pb-2 text-base font-bold text-gray-900">
              {labels.language}
            </h2>
            <ul role="listbox" className="space-y-1">
              {menuLanguages.map((code) => (
                <li key={code} role="option" aria-selected={code === lang}>
                  <a
                    href={`/menu/${slug}/${code}`}
                    onClick={() => rememberMenuLanguage(code)}
                    className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                      code === lang
                        ? "bg-gray-100 text-black"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <span className="text-xl leading-none">
                      {getLanguageFlag(code)}
                    </span>
                    <span className="flex-1">{languageLabel(code)}</span>
                    {code === lang && (
                      <Check className="size-4 text-gray-700" aria-hidden />
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </BottomSheet>
      )}

      {/* The capsule hugs its tabs and sits centred, like the latest iOS */}
      <div className="pointer-events-none fixed inset-x-4 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-40 flex justify-center md:hidden">
      <nav
        aria-label={labels.categories}
        className="pointer-events-auto flex gap-1 rounded-[28px] border border-white/60 bg-white/70 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-2xl backdrop-saturate-150"
      >
        {showHome && (
          <Link
            href={homeHref}
            scroll={false}
            aria-current={homeActive ? "page" : undefined}
            className={`${tab} ${homeActive ? "" : "text-gray-500"}`}
            style={homeActive ? activeStyle : undefined}
          >
            <House className="size-6" strokeWidth={1.75} aria-hidden />
            {labels.home}
          </Link>
        )}

        {showCategories && (
          <button
            type="button"
            onClick={() => {
              setLangOpen(false);
              setDrawerOpen(true);
            }}
            aria-haspopup="dialog"
            className={`${tab} ${drawerOpen ? "" : "text-gray-500"}`}
            style={drawerOpen ? activeStyle : undefined}
          >
            <LayoutGrid className="size-6" strokeWidth={1.75} aria-hidden />
            {labels.categories}
          </button>
        )}

        {showLanguage && (
          <div className="relative flex">
            <button
              type="button"
              onClick={() => setLangOpen((v) => !v)}
              aria-haspopup="dialog"
              aria-expanded={langOpen}
              className={`${tab} ${langOpen ? "" : "text-gray-500"}`}
              style={langOpen ? activeStyle : undefined}
            >
              <Globe className="size-6" strokeWidth={1.75} aria-hidden />
              {labels.language}
            </button>
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
            style={cartOpen ? activeStyle : undefined}
          >
            <span className="relative">
              <ShoppingBag className="size-6" strokeWidth={1.75} aria-hidden />
              {itemCount > 0 && (
                <span
                  className="absolute -right-2 -top-1 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-4 text-white"
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
      </div>
    </>
  );
}
