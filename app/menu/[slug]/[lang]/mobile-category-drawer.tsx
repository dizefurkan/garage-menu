"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";

export interface DrawerCategory {
  id: number | string;
  name: string;
  count: number;
  children: { id: number | string; name: string; count: number }[];
}

const LABELS: Record<string, { open: string; close: string; all: string }> = {
  tr: { open: "Kategorileri aç", close: "Kapat", all: "Tümü" },
  en: { open: "Open categories", close: "Close", all: "All" },
  de: { open: "Kategorien öffnen", close: "Schließen", all: "Alle" },
  fr: { open: "Ouvrir les catégories", close: "Fermer", all: "Tout" },
  es: { open: "Abrir categorías", close: "Cerrar", all: "Todo" },
  ru: { open: "Открыть категории", close: "Закрыть", all: "Все" },
  ar: { open: "فتح الفئات", close: "إغلاق", all: "الكل" },
  zh: { open: "打开分类", close: "关闭", all: "全部" },
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
  activeParentId,
}: {
  categories: DrawerCategory[];
  title: string;
  lang: string;
  /** true: category-first layout (page navigation); false: in-page anchors */
  navigate: boolean;
  tableId?: string;
  activeId?: number | string;
  /** Parent of the active sub-category, so its branch starts expanded. */
  activeParentId?: number | string;
}) {
  const [open, setOpen] = useState(false);
  const labels = LABELS[lang] || LABELS.en;
  // Branches the user has toggled; the active one starts expanded
  const [expanded, setExpanded] = useState<Set<string>>(
    () =>
      new Set(
        [activeId, activeParentId]
          .filter((id) => id !== undefined)
          .map(String)
      )
  );
  const toggle = (id: number | string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (!next.delete(String(id))) next.add(String(id));
      return next;
    });
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
        className="fixed right-4 top-3 z-40 flex size-11 items-center justify-center rounded-full text-gray-800 transition-transform active:scale-95"
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
            {categories.map((cat) => {
              if (cat.children.length === 0) {
                return (
                  <li key={cat.id}>
                    {renderLink(
                      cat.id,
                      cat.name,
                      cat.count,
                      String(cat.id) === String(activeId),
                      false
                    )}
                  </li>
                );
              }

              const isOpen = expanded.has(String(cat.id));
              return (
                <li key={cat.id}>
                  <button
                    type="button"
                    onClick={() => toggle(cat.id)}
                    aria-expanded={isOpen}
                    className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                  >
                    <span className="min-w-0 truncate">{cat.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="text-xs font-normal text-gray-400">
                        {cat.count}
                      </span>
                      <ChevronDown
                        className={`size-4 text-gray-400 transition-transform duration-200 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden
                      />
                    </span>
                  </button>
                  {/* 0fr -> 1fr animates height without measuring it */}
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                      isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                    }`}
                  >
                    <ul
                      inert={!isOpen}
                      className="ml-3 min-h-0 space-y-0.5 overflow-hidden border-l border-gray-200 pl-2"
                    >
                      <li className="pt-0.5">
                        {renderLink(
                          cat.id,
                          labels.all,
                          cat.count,
                          String(cat.id) === String(activeId),
                          true
                        )}
                      </li>
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
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </div>
  );
}
