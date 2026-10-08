"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "none";

type CategoryOption = { id: number; parent_id: number | null; name: string };

/**
 * Picks the parent of a category. Only top-level categories are offered
 * (sub-categories go one level deep), and the category being edited is left
 * out. A category that already has sub-categories cannot get a parent, so the
 * select locks with an explanation instead of failing on save.
 */
export function ParentSelect({
  value,
  onChange,
  lang,
  excludeId,
  disabled,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  lang: string;
  excludeId?: number;
  disabled?: boolean;
}) {
  const t = useTranslations("categoryForm");
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  useEffect(() => {
    fetch(`/api/admin/categories?lang=${lang}`)
      .then((res) => (res.ok ? res.json() : []))
      .then(setCategories)
      .catch(() => setCategories([]));
  }, [lang]);

  const hasChildren =
    excludeId !== undefined &&
    categories.some((c) => c.parent_id === excludeId);
  const options = categories.filter(
    (c) => c.parent_id === null && c.id !== excludeId
  );

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">{t("parentLabel")}</label>
      <Select
        items={[
          { value: NONE, label: t("parentNone") },
          ...options.map((c) => ({ value: String(c.id), label: c.name })),
        ]}
        value={value ?? NONE}
        onValueChange={(next) => onChange(next === NONE ? null : next)}
        disabled={disabled || hasChildren}
      >
        <SelectTrigger className="!h-10 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE}>{t("parentNone")}</SelectItem>
          {options.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        {hasChildren ? t("parentLockedHint") : t("parentHint")}
      </p>
    </div>
  );
}
