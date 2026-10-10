"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { MarqueeText } from "./marquee-text";
import { BottomSheet } from "./bottom-sheet";

export interface DrawerCategory {
  id: number | string;
  name: string;
  count: number;
  children: { id: number | string; name: string; count: number }[];
}

const LABELS: Record<string, { close: string; all: string }> = {
  tr: { close: "Kapat", all: "Tümü" },
  en: { close: "Close", all: "All" },
  de: { close: "Schließen", all: "Alle" },
  fr: { close: "Fermer", all: "Tout" },
  es: { close: "Cerrar", all: "Todo" },
  ru: { close: "Закрыть", all: "Все" },
  ar: { close: "إغلاق", all: "الكل" },
  zh: { close: "关闭", all: "全部" },
};

/**
 * Mobile category navigator as a bottom sheet (opened from the tab bar, open
 * state owned by the caller). Categories without sub-categories are plain
 * links; one with sub-categories slides its own panel in from the right (the
 * others are out of view), with a back row to return to the full list.
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
  open,
  onOpenChange,
}: {
  categories: DrawerCategory[];
  title: string;
  lang: string;
  /** true: category-first layout (page navigation); false: in-page anchors */
  navigate: boolean;
  tableId?: string;
  activeId?: number | string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  // The branch panel currently slid in, if any. `branch` outlives the slide
  // out so the panel keeps its content while it animates away.
  const [branchId, setBranchId] = useState<number | string | null>(null);
  const labels = LABELS[lang] || LABELS.en;
  const lastBranch = useRef<DrawerCategory | null>(null);

  const branch =
    categories.find((cat) => String(cat.id) === String(branchId)) ?? null;
  if (branch) lastBranch.current = branch;
  const panelBranch = branch ?? lastBranch.current;

  if (categories.length === 0) return null;

  const close = () => {
    onOpenChange(false);
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

  const headerClass =
    "flex h-14 shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-4";

  return (
    <BottomSheet
      open={open}
      onClose={close}
      // Escape steps back out of a branch before it closes the sheet
      onEscape={() => (branchId !== null ? setBranchId(null) : close())}
      label={title}
      className="h-[min(75dvh,36rem)]"
    >
      <div className="relative flex-1 overflow-hidden">
        {/* Full list */}
        <div
          inert={branchId !== null}
          className={`absolute inset-0 flex flex-col bg-white transition-transform duration-300 ease-out ${
            branchId !== null ? "-translate-x-1/4" : "translate-x-0"
          }`}
        >
          <div className={headerClass}>
            <h2 className="min-w-0 truncate text-base font-bold text-gray-900">
              {title}
            </h2>
            <button
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
          <div className={headerClass}>
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
                <MarqueeText>{panelBranch.name}</MarqueeText>
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
      </div>
    </BottomSheet>
  );
}
