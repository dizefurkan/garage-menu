"use client";

import { useTranslations } from "next-intl";
import {
  CircleAlert,
  CircleCheck,
  EyeOff,
  type LucideIcon,
} from "lucide-react";

export type ProductStatus = "on_sale" | "out_of_stock" | "hidden";

const STATUS_META: Record<
  ProductStatus,
  { icon: LucideIcon; labelKey: string; className: string }
> = {
  on_sale: {
    icon: CircleCheck,
    labelKey: "availabilityOnSale",
    className: "text-emerald-600",
  },
  out_of_stock: {
    icon: CircleAlert,
    labelKey: "availabilityOutOfStock",
    className: "text-amber-600",
  },
  hidden: {
    icon: EyeOff,
    labelKey: "availabilityHidden",
    className: "text-muted-foreground",
  },
};

const STATUS_ORDER: ProductStatus[] = ["on_sale", "out_of_stock", "hidden"];

/**
 * Two booleans, one control. "hidden" wins over "out of stock" because an
 * unrendered product has nothing to label.
 */
export function toProductStatus(product: {
  is_available?: boolean | null;
  is_out_of_stock?: boolean | null;
}): ProductStatus {
  return !product.is_available
    ? "hidden"
    : product.is_out_of_stock
      ? "out_of_stock"
      : "on_sale";
}

export function fromProductStatus(status: ProductStatus): {
  is_available: boolean;
  is_out_of_stock: boolean;
} {
  return {
    is_available: status !== "hidden",
    is_out_of_stock: status === "out_of_stock",
  };
}

interface ProductStatusSelectProps {
  value: ProductStatus;
  onChange: (next: ProductStatus) => void;
  disabled?: boolean;
  /** Pulses the icon while a change is being persisted. */
  busy?: boolean;
  size?: "sm" | "default";
  className?: string;
}

export function ProductStatusSelect({
  value,
  onChange,
  disabled = false,
  busy = false,
  size = "default",
  className = "flex items-center gap-2",
}: ProductStatusSelectProps) {
  const t = useTranslations("admin");
  const meta = STATUS_META[value];
  const Icon = meta.icon;

  return (
    <div className={className}>
      <Icon
        className={`size-4 shrink-0 ${meta.className} ${
          busy ? "animate-pulse" : ""
        }`}
        aria-hidden
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ProductStatus)}
        disabled={disabled}
        aria-label={t("availabilityTitle")}
        className={`rounded-md border border-input bg-background font-medium disabled:opacity-50 ${
          size === "sm" ? "h-8 px-2 text-xs" : "h-9 px-3 text-sm"
        }`}
      >
        {STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {t(STATUS_META[status].labelKey)}
          </option>
        ))}
      </select>
    </div>
  );
}
