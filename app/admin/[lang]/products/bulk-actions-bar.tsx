"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, X } from "lucide-react";
import { fromProductStatus, type ProductStatus } from "./product-status-select";

interface BulkActionsBarProps {
  selectedIds: number[];
  onClear: () => void;
  /** Refetch the current page once the server has been updated. */
  onDone: () => void;
}

export function BulkActionsBar({
  selectedIds,
  onClear,
  onDone,
}: BulkActionsBarProps) {
  const t = useTranslations("admin");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const count = selectedIds.length;
  if (count === 0) return null;

  const run = async (body: Record<string, unknown>, successKey: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/products/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, productIds: selectedIds }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || t("bulkFailed"));
      }
      toast.success(t(successKey, { count: data.affected ?? count }));
      onClear();
      onDone();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("bulkFailed"));
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  const handleStatusChange = (status: ProductStatus) => {
    run({ action: "status", ...fromProductStatus(status) }, "bulkStatusDone");
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-md border bg-muted/40 px-4 py-3">
        <span className="text-sm font-medium">
          {t("bulkSelectedCount", { count })}
        </span>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t("availabilityTitle")}
          </span>
          <select
            value=""
            disabled={busy}
            onChange={(e) => {
              if (e.target.value) {
                handleStatusChange(e.target.value as ProductStatus);
              }
            }}
            aria-label={t("bulkChangeStatus")}
            className="h-8 rounded-md border border-input bg-background px-2 text-xs font-medium disabled:opacity-50"
          >
            <option value="">{t("bulkChangeStatus")}</option>
            <option value="on_sale">{t("availabilityOnSale")}</option>
            <option value="out_of_stock">{t("availabilityOutOfStock")}</option>
            <option value="hidden">{t("availabilityHidden")}</option>
          </select>
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="mr-2 size-4" />
          {t("delete")}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          disabled={busy}
          onClick={onClear}
        >
          <X className="mr-2 size-4" />
          {t("bulkClearSelection")}
        </Button>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("bulkDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("bulkDeleteDescription", { count })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                run({ action: "delete" }, "bulkDeleteDone");
              }}
            >
              {busy ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
