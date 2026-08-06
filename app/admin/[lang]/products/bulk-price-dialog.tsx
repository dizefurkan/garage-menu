"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";

type Direction = "increase" | "decrease";
type Rounding = "cent" | "whole";
type Scope = "selected" | "filter";

interface PriceChange {
  id: number;
  name: string | null;
  currency: string;
  oldPrice: number;
  newPrice: number;
}

interface BulkPriceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: number[];
  /** Category currently filtering the table, or null for "all categories". */
  categoryId: number | null;
  /** How many products the current filter matches, across every page. */
  filterTotal: number;
  onApplied: () => void;
}

export function BulkPriceDialog({
  open,
  onOpenChange,
  selectedIds,
  categoryId,
  filterTotal,
  onApplied,
}: BulkPriceDialogProps) {
  const t = useTranslations("admin");
  const params = useParams();
  const currentLang = (params?.lang as string) || "en";

  // Base UI portals its popups to <body> by default. The Radix dialog around
  // them kills pointer events outside its content and traps focus, so a popup
  // landing on <body> is dismissed the instant it opens. Anchoring the portals
  // to the dialog's own element is what makes these selects usable at all.
  const contentRef = useRef<HTMLDivElement>(null);

  const [direction, setDirection] = useState<Direction>("increase");
  const [amount, setAmount] = useState("10");
  const [rounding, setRounding] = useState<Rounding>("cent");
  const [scope, setScope] = useState<Scope>("selected");
  const [excludeSelected, setExcludeSelected] = useState(false);
  const [preview, setPreview] = useState<PriceChange[] | null>(null);
  const [previewTotal, setPreviewTotal] = useState(0);
  const [truncated, setTruncated] = useState(false);
  const [busy, setBusy] = useState(false);

  const parsed = Number(amount.replace(",", "."));
  const percent = direction === "increase" ? parsed : -parsed;
  const validPercent = Number.isFinite(parsed) && parsed > 0 && parsed <= 1000;

  // Any change to the inputs makes the previewed numbers stale. Dropping the
  // preview forces a fresh one before Apply lights up again — otherwise a user
  // could preview +10%, switch to -10%, and commit prices they never saw.
  useEffect(() => {
    setPreview(null);
  }, [direction, amount, rounding, scope, excludeSelected]);

  // Reset to a clean slate whenever the dialog is reopened.
  useEffect(() => {
    if (open) {
      setScope(selectedIds.length > 0 ? "selected" : "filter");
      setExcludeSelected(false);
      setPreview(null);
    }
  }, [open, selectedIds.length]);

  const body = () => ({
    action: "price",
    percent,
    rounding,
    lang: currentLang,
    ...(scope === "selected"
      ? { productIds: selectedIds }
      : {
          scope: "filter",
          categoryId,
          excludeIds: excludeSelected ? selectedIds : [],
        }),
  });

  const request = async (dryRun: boolean) => {
    const response = await fetch("/api/admin/products/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body(), dryRun }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || t("bulkFailed"));
    return data as {
      affected: number;
      truncated: boolean;
      changes: PriceChange[];
    };
  };

  const handlePreview = async () => {
    setBusy(true);
    try {
      const data = await request(true);
      setPreview(data.changes);
      setPreviewTotal(data.affected);
      setTruncated(data.truncated);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("bulkFailed"));
    } finally {
      setBusy(false);
    }
  };

  const handleApply = async () => {
    setBusy(true);
    try {
      const data = await request(false);
      toast.success(t("bulkPriceDone", { count: data.affected }));
      onOpenChange(false);
      onApplied();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("bulkFailed"));
    } finally {
      setBusy(false);
    }
  };

  const scopeCount =
    scope === "selected"
      ? selectedIds.length
      : Math.max(filterTotal - (excludeSelected ? selectedIds.length : 0), 0);

  const money = (value: number, currency: string) =>
    new Intl.NumberFormat("tr-TR", { style: "currency", currency }).format(
      value
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={contentRef} className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("bulkPriceTitle")}</DialogTitle>
          <DialogDescription>{t("bulkPriceDescription")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Scope */}
          <div className="space-y-2">
            <label className="text-sm font-medium">{t("bulkPriceScope")}</label>
            <Select
              value={scope}
              onValueChange={(value) => value && setScope(value as Scope)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent container={contentRef}>
                <SelectItem value="selected" disabled={selectedIds.length === 0}>
                  {t("bulkPriceScopeSelected", { count: selectedIds.length })}
                </SelectItem>
                <SelectItem value="filter">
                  {t("bulkPriceScopeFilter", { count: filterTotal })}
                </SelectItem>
              </SelectContent>
            </Select>

            {/* The table only holds the page on screen, so "everything except
                these" is the one exclusion the UI can honestly express. */}
            {scope === "filter" && selectedIds.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox
                  checked={excludeSelected}
                  onCheckedChange={(checked) =>
                    setExcludeSelected(checked === true)
                  }
                />
                {t("bulkPriceExcludeSelected", { count: selectedIds.length })}
              </label>
            )}
          </div>

          {/* Direction + amount */}
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("bulkPriceDirection")}
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant={direction === "increase" ? "default" : "outline"}
                  onClick={() => setDirection("increase")}
                >
                  <TrendingUp className="mr-2 size-4" />
                  {t("bulkPriceIncrease")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={direction === "decrease" ? "default" : "outline"}
                  onClick={() => setDirection("decrease")}
                >
                  <TrendingDown className="mr-2 size-4" />
                  {t("bulkPriceDecrease")}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="bulk-price-amount" className="text-sm font-medium">
                {t("bulkPriceAmount")}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  id="bulk-price-amount"
                  inputMode="decimal"
                  className="w-24"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
                <span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("bulkPriceRounding")}
              </label>
              <Select
                value={rounding}
                onValueChange={(value) => value && setRounding(value as Rounding)}
              >
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent container={contentRef}>
                  <SelectItem value="cent">
                    {t("bulkPriceRoundingCent")}
                  </SelectItem>
                  <SelectItem value="whole">
                    {t("bulkPriceRoundingWhole")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Preview */}
          {preview && (
            <div className="rounded-md border">
              <div className="border-b bg-muted/40 px-3 py-2 text-sm font-medium">
                {t("bulkPricePreviewCount", { count: previewTotal })}
              </div>
              {preview.length === 0 ? (
                <p className="px-3 py-4 text-sm text-muted-foreground">
                  {t("bulkPriceNoChange")}
                </p>
              ) : (
                <>
                  <ul className="max-h-56 divide-y overflow-y-auto text-sm">
                    {preview.map((change) => (
                      <li
                        key={change.id}
                        className="flex items-center justify-between gap-3 px-3 py-2"
                      >
                        <span className="truncate">
                          {change.name ?? `#${change.id}`}
                        </span>
                        <span className="flex shrink-0 items-center gap-2 tabular-nums">
                          <span className="text-muted-foreground line-through">
                            {money(change.oldPrice, change.currency)}
                          </span>
                          <ArrowRight className="size-3 text-muted-foreground" />
                          <span className="font-medium">
                            {money(change.newPrice, change.currency)}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  {truncated && (
                    <p className="border-t px-3 py-2 text-xs text-muted-foreground">
                      {t("bulkPricePreviewTruncated", {
                        shown: preview.length,
                        count: previewTotal,
                      })}
                    </p>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          {!preview ? (
            <Button
              disabled={busy || !validPercent || scopeCount === 0}
              onClick={handlePreview}
            >
              {busy ? t("bulkPricePreviewing") : t("bulkPricePreview")}
            </Button>
          ) : (
            <Button
              disabled={busy || previewTotal === 0}
              onClick={handleApply}
            >
              {busy ? t("bulkPriceApplying") : t("bulkPriceApply")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
