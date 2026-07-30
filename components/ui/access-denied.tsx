"use client";

import { useTranslations } from "next-intl";
import { ShieldOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * 403 screen for pages a role cannot reach.
 *
 * Shares the EmptyState shell but not its tone: an empty table invites you to
 * fill it, a permission boundary just tells you where the edge is. No CTA —
 * the viewer cannot grant themselves access.
 *
 * This is UI only. The real boundary is the RLS policy on the table; without
 * that, hiding the page just hides the door.
 */
export function AccessDenied({ className }: { className?: string }) {
  const t = useTranslations("emptyStates.accessDenied");

  return (
    <EmptyState
      icon={ShieldOff}
      tone="inform"
      title={t("title")}
      description={t("description")}
      className={className}
    />
  );
}
