"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { MarqueeText } from "./marquee-text";

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
 * right-hand drawer. Categories without sub-categories are plain links; one
 * with sub-categories slides its own panel in from the right (the others are
 * out of view), with a back row to return to the full list.
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
  // The branch panel currently slid in, if any. `branch` outlives the slide
  // out so the panel keeps its content while it animates away.
  const [branchId, setBranchId] = useState<number | string | null>(null);
  const [headerHeight, setHeaderHeight] = useState<number | null>(null);
  const labels = LABELS[lang] || LABELS.en;
  const closeRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const lastBranch = useRef<DrawerCategory | null>(null);

  const branch =
    categories.find((cat) => String(cat.id) === String(branchId)) ?? null;
  if (branch) lastBranch.current = branch;
  const panelBranch = branch ?? lastBranch.current;

  useEffect(() => {
    if (!open) return;
    // Match the page header so the drawer's title row lines up with it
    const header = document.querySelector("header");
    if (header) setHeaderHeight(header.getBoundingClientRect().height);

    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // Escape steps back out of a branch before closing the drawer
      if (branchId !== null) setBranchId(null);
      else setOpen(false);
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
  }, [open, branchId]);

  if (categories.length === 0) return null;

  const close = () => {
    setOpen(false);
    setBranchId(null);
  };

  const hrefFor = (id: number | string) =>
    navigate
      ? `?category=${id}${tableId ? `&tableId=${tableId}` : ""}`
      : `#category-${id}`;

  const renderLink = (
    id: number | string,
    name: string,
    count: number,
    isChild = false
  ) => {
    const isActive = String(id) === String(activeId);
    const className = `flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 text-sm transition-colors ${
      isChild ? "font-normal text-gray-700" : "font-semibold text-gray-900"
    } ${isActive ? "bg-gray-100" : "hover:bg-gray-50"}`;
    const content = (
      <>
        <span className="min-w-0 flex-1">
          <MarqueeText>{name}</MarqueeText>
        </span>
        <span className="shrink-0 text-xs text-gray-400">{count}</span>
      </>
    );
    return navigate ? (
      <Link
        href={hrefFor(id)}
        scroll={false}
        onClick={close}
        aria-current={isActive ? "page" : undefined}
        className={className}
      >
        {content}
      </Link>
    ) : (
      <a href={hrefFor(id)} onClick={close} className={className}>
        {content}
      </a>
    );
  };

  // Shared by both panels' title rows
  const headerStyle = headerHeight ? { height: headerHeight } : undefined;
  const headerClass =
    "flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4" +
    (headerHeight ? "" : " h-20");

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
        onClick={close}
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
        className={`fixed inset-y-0 right-0 z-[60] w-[85%] max-w-sm overflow-hidden bg-white shadow-2xl transition-[transform,visibility] duration-300 ease-out ${
          open ? "visible translate-x-0" : "invisible translate-x-full"
        }`}
      >
        {/* Full list */}
        <div
          inert={branchId !== null}
          className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-out ${
            branchId !== null ? "-translate-x-1/4" : "translate-x-0"
          }`}
        >
          <div className={headerClass} style={headerStyle}>
            <h2 className="min-w-0 truncate text-base font-bold text-gray-900">
              {title}
            </h2>
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto overscroll-contain p-3">
            <ul className="space-y-1">
              {categories.map((cat) =>
                cat.children.length === 0 ? (
                  <li key={cat.id}>{renderLink(cat.id, cat.name, cat.count)}</li>
                ) : (
                  <li key={cat.id}>
                    <button
                      type="button"
                      onClick={() => setBranchId(cat.id)}
                      className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
                    >
                      <span className="min-w-0 flex-1">
                        <MarqueeText>{cat.name}</MarqueeText>
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5">
                        <span className="text-xs font-normal text-gray-400">
                          {cat.count}
                        </span>
                        <ChevronRight
                          className="size-4 text-gray-400 rtl:rotate-180"
                          aria-hidden
                        />
                      </span>
                    </button>
                  </li>
                )
              )}
            </ul>
          </nav>
        </div>

        {/* Branch: the chosen category and its sub-categories only */}
        <div
          inert={branchId === null}
          className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-out ${
            branchId !== null ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className={headerClass} style={headerStyle}>
            <button
              type="button"
              onClick={() => setBranchId(null)}
              className="-ml-2 flex min-h-11 min-w-0 items-center gap-1 rounded-lg px-2 text-gray-600 hover:bg-gray-100"
            >
              <ChevronLeft className="size-5 shrink-0 rtl:rotate-180" aria-hidden />
              <span className="truncate text-sm font-medium">{title}</span>
            </button>
            <button
              type="button"
              onClick={close}
              aria-label={labels.close}
              className="flex size-11 shrink-0 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          {panelBranch && (
            <nav className="flex-1 overflow-y-auto overscroll-contain p-3">
              <h3 className="px-3 pb-2 pt-1 text-lg font-bold text-gray-900">
                {panelBranch.name}
              </h3>
              <ul className="space-y-1">
                <li>
                  {renderLink(
                    panelBranch.id,
                    labels.all,
                    panelBranch.count,
                    true
                  )}
                </li>
                {panelBranch.children.map((child) => (
                  <li key={child.id}>
                    {renderLink(child.id, child.name, child.count, true)}
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>
      </aside>
    </div>
  );
}
