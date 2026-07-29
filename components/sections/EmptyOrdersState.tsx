"use client";

import { useTranslations } from "next-intl";
import { ClipboardList } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * No CTA on purpose. An empty product table is a gap the owner should close;
 * an empty order list just means nobody has ordered yet, which is a waiting
 * state, not a task. Pushing an action here would invent work.
 */
export function EmptyOrdersState() {
  const t = useTranslations("emptyStates.orders");

  return (
    <EmptyState
      icon={ClipboardList}
      title={t("title")}
      description={t("description")}
    />
  );
}
