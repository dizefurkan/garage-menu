"use client";

import { useTranslations } from "next-intl";
import {
  CircleAlert,
  CircleCheck,
  EyeOff,
  type LucideIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

export const PRODUCT_STATUSES: ProductStatus[] = [
  "on_sale",
  "out_of_stock",
  "hidden",
];

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

/** Icon + label pair, shared by the select options and the bulk menu. */
export function ProductStatusLabel({ status }: { status: ProductStatus }) {
  const t = useTranslations("admin");
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <>
      <Icon className={meta.className} aria-hidden />
      <span>{t(meta.labelKey)}</span>
    </>
  );
}

interface ProductStatusSelectProps {
  value: ProductStatus;
  onChange: (next: ProductStatus) => void;
  disabled?: boolean;
  /** Pulses the icon while a change is being persisted. */
  busy?: boolean;
  size?: "sm" | "default";
  /** Applied to the trigger, e.g. to match a neighbouring button's height. */
  className?: string;
}

export function ProductStatusSelect({
  value,
  onChange,
  disabled = false,
  busy = false,
  size = "default",
  className,
}: ProductStatusSelectProps) {
  const t = useTranslations("admin");
  const meta = STATUS_META[value];
  const Icon = meta.icon;

  return (
    <Select
      value={value}
      onValueChange={(next) => next && onChange(next as ProductStatus)}
      disabled={disabled}
    >
      <SelectTrigger
        size={size}
        aria-label={t("availabilityTitle")}
        className={className}
      >
        <SelectValue>
          <Icon
            className={`${meta.className} ${busy ? "animate-pulse" : ""}`}
            aria-hidden
          />
          <span>{t(meta.labelKey)}</span>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {PRODUCT_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            <ProductStatusLabel status={status} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
