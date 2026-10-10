"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export interface DrawerCategory {
  id: number | string;
  name: string;
  count: number;
  children: { id: number | string; name: string; count: number }[];
}

const LABELS: Record<string, { open: string; close: string }> = {
  tr: { open: "Kategorileri aç", close: "Kapat" },
  en: { open: "Open categories", close: "Close" },
  de: { open: "Kategorien öffnen", close: "Schließen" },
  fr: { open: "Ouvrir les catégories", close: "Fermer" },
  es: { open: "Abrir categorías", close: "Cerrar" },
  ru: { open: "Открыть категории", close: "Закрыть" },
  ar: { open: "فتح الفئات", close: "إغلاق" },
  zh: { open: "打开分类", close: "关闭" },
};

/**
 * Mobile category navigator: a hamburger pinned top-right that opens a
 * right-hand drawer listing categories with their sub-categories indented
 * beneath. It replaces the bottom-right floating button, which sat on top of
 * the cart button.
 *
 * Category-first layout navigates (?category=<id>); the flat layout jumps to
 * the in-page anchor.
 */
export function MobileCategoryDrawer({
  categories,
  title,
  lang,
  navigate,
  tableId,
  activeId,
}: {
  categories: DrawerCategory[];
  title: string;
  lang: string;
  /** true: category-first layout (page navigation); false: in-page anchors */
  navigate: boolean;
  tableId?: string;
  activeId?: number | string;
}) {
  const [open, setOpen] = useState(false);
  const labels = LABELS[lang] || LABELS.en;
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const trigger = triggerRef.current;
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      trigger?.focus();
    };
  }, [open]);

  if (categories.length === 0) return null;

  const hrefFor = (id: number | string) =>
    navigate
      ? `?category=${id}${tableId ? `&tableId=${tableId}` : ""}`
      : `#category-${id}`;

  const renderLink = (
    id: number | string,
    name: string,
    count: number,
    isActive: boolean,
    isChild: boolean
  ) => {
    const className = `flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm transition-colors ${
      isChild ? "font-normal text-gray-700" : "font-semibold text-gray-900"
    } ${isActive ? "bg-gray-100" : "hover:bg-gray-50"}`;
    const content = (
      <>
        <span className="min-w-0 truncate">{name}</span>
        <span className="shrink-0 text-xs text-gray-400">{count}</span>
      </>
    );
    return navigate ? (
      <Link
        href={hrefFor(id)}
        scroll={false}
        onClick={() => setOpen(false)}
        aria-current={isActive ? "page" : undefined}
        className={className}
      >
        {content}
      </Link>
    ) : (
      <a href={hrefFor(id)} onClick={() => setOpen(false)} className={className}>
        {content}
      </a>
    );
  };

  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label={labels.open}
        aria-expanded={open}
        className="fixed right-4 top-3 z-40 flex size-11 items-center justify-center rounded-full bg-white text-gray-800 shadow-md ring-1 ring-black/5 transition-transform active:scale-95"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        aria-hidden={!open}
        className={`fixed inset-y-0 right-0 z-[60] flex w-[85%] max-w-sm flex-col bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-out ${
          open ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-gray-100 px-4">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label={labels.close}
            className="flex size-11 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overscroll-contain p-3">
          <ul className="space-y-1">
            {categories.map((cat) => (
              <li key={cat.id}>
                {renderLink(
                  cat.id,
                  cat.name,
                  cat.count,
                  String(cat.id) === String(activeId),
                  false
                )}
                {cat.children.length > 0 && (
                  <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-gray-200 pl-2">
                    {cat.children.map((child) => (
                      <li key={child.id}>
                        {renderLink(
                          child.id,
                          child.name,
                          child.count,
                          String(child.id) === String(activeId),
                          true
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
