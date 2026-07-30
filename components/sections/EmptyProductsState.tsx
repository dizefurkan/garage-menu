"use client";

import { useTranslations } from "next-intl";
import { Package } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function EmptyProductsState({ lang = "en" }: { lang?: string }) {
  const t = useTranslations("emptyStates.products");

  return (
    <EmptyState
      icon={Package}
      title={t("title")}
      description={t("description")}
      action={{ label: t("action"), href: `/admin/${lang}/products/new` }}
    />
  );
}
