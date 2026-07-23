"use client";

import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";

export interface AllergenOption {
  id: number;
  code: string;
  emoji: string;
  name: string;
}

interface AllergenSelectorProps {
  allergens: AllergenOption[];
  selectedIds: number[];
  containsNoAllergens: boolean;
  onChange: (selectedIds: number[], containsNoAllergens: boolean) => void;
  disabled?: boolean;
}

export function AllergenSelector({
  allergens,
  selectedIds,
  containsNoAllergens,
  onChange,
  disabled = false,
}: AllergenSelectorProps) {
  const t = useTranslations("admin");

  const handleToggleAllergen = (allergenId: number, checked: boolean) => {
    const next = checked
      ? [...selectedIds, allergenId]
      : selectedIds.filter((id) => id !== allergenId);
    // Selecting an allergen contradicts "contains no allergens"
    onChange(next, checked ? false : containsNoAllergens);
  };

  const handleToggleNoAllergens = (checked: boolean) => {
    onChange(checked ? [] : selectedIds, checked);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Switch
          id="contains_no_allergens"
          checked={containsNoAllergens}
          onCheckedChange={handleToggleNoAllergens}
          disabled={disabled}
        />
        <label
          htmlFor="contains_no_allergens"
          className="cursor-pointer text-sm font-medium"
        >
          {t("containsNoAllergens")}
        </label>
      </div>

      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${
          containsNoAllergens ? "pointer-events-none opacity-50" : ""
        }`}
      >
        {allergens.map((allergen) => (
          <label
            key={allergen.id}
            className="flex cursor-pointer items-center gap-2 rounded-md border border-input px-3 py-2 text-sm"
          >
            <Checkbox
              checked={selectedIds.includes(allergen.id)}
              onCheckedChange={(checked) =>
                handleToggleAllergen(allergen.id, Boolean(checked))
              }
              disabled={disabled || containsNoAllergens}
            />
            <span aria-hidden="true">{allergen.emoji}</span>
            <span>{allergen.name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
