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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Trash2, X } from "lucide-react";
import {
  PRODUCT_STATUSES,
  ProductStatusLabel,
  fromProductStatus,
  type ProductStatus,
} from "./product-status-select";

interface BulkActionsBarProps {
  selectedIds: number[];
  /**
   * How many selected products are not on screen right now. Selection survives
   * paging and the search box on purpose, so without this the bar can claim
   * "2 selected" over a list showing one ticked row and look broken.
   */
  hiddenCount: number;
  onClear: () => void;
  /** Refetch the current page once the server has been updated. */
  onDone: () => void;
}

export function BulkActionsBar({
  selectedIds,
  hiddenCount,
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
          {hiddenCount > 0 && (
            <span className="ml-1 font-normal text-muted-foreground">
              {t("bulkSelectedHidden", { count: hiddenCount })}
            </span>
          )}
        </span>

        <DropdownMenu>
          {/* Base UI composes via `render`, not `asChild`. */}
          <DropdownMenuTrigger
            render={<Button variant="outline" size="sm" />}
            disabled={busy}
          >
            {t("bulkChangeStatus")}
            <ChevronDown className="ml-2 size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {PRODUCT_STATUSES.map((status) => (
              <DropdownMenuItem
                key={status}
                className="gap-2"
                onSelect={() => handleStatusChange(status)}
              >
                <ProductStatusLabel status={status} />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

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
