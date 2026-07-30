"use client";

import { useTranslations } from "next-intl";
import { Tag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";

export function EmptyCategoriesState({ lang = "en" }: { lang?: string }) {
  const t = useTranslations("emptyStates.categories");

  return (
    <EmptyState
      icon={Tag}
      title={t("title")}
      description={t("description")}
      action={{ label: t("action"), href: `/admin/${lang}/categories/new` }}
    />
  );
}
