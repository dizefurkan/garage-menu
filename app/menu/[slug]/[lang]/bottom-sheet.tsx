"use client";

import { useEffect, useRef } from "react";

/**
 * Mobile bottom sheet: a dimmed backdrop and a panel that slides up from the
 * bottom edge with a grab handle, above the tab bar. Closes on backdrop tap
 * and Escape, locks page scroll while open, and keeps hidden content out of
 * the tab order.
 */
export function BottomSheet({
  open,
  onClose,
  onEscape,
  label,
  className = "",
  children,
}: {
  open: boolean;
  onClose: () => void;
  /** Replaces closing on Escape, e.g. to step back out of a sub-panel first */
  onEscape?: () => void;
  label: string;
  /** Sizing, e.g. a fixed height when inner panels slide sideways */
  className?: string;
  children: React.ReactNode;
}) {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Keep the latest handler without re-running the effects below on every
  // parent render
  const escapeRef = useRef(onEscape ?? onClose);
  escapeRef.current = onEscape ?? onClose;

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") escapeRef.current();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // Focus the sheet so Escape and screen readers start inside it
    sheetRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <div
        onClick={onClose}
        aria-hidden
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-hidden={!open}
        tabIndex={-1}
        className={`fixed inset-x-0 bottom-0 z-[60] flex flex-col rounded-t-3xl bg-white shadow-[0_-8px_40px_rgba(0,0,0,0.15)] outline-none transition-[translate,visibility] duration-300 ease-out pb-[env(safe-area-inset-bottom)] ${
          open ? "visible translate-y-0" : "invisible translate-y-full"
        } ${className}`}
      >
        <div className="flex shrink-0 justify-center pb-1 pt-2.5" aria-hidden>
          <span className="h-1 w-10 rounded-full bg-gray-300" />
        </div>
        {children}
      </div>
    </div>
  );
}
