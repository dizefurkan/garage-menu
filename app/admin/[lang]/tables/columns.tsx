"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowUpDown, MoreHorizontal, Pencil, QrCode, Trash2 } from "lucide-react";
import { RenameTableDialog } from "./rename-table-dialog";
import { QrPreviewDialog } from "./qr-preview-dialog";

export interface TableRow {
  id: string;
  label: string;
  is_active: boolean;
  created_at: string;
}

interface ColumnCallbacks {
  onRenamed: (id: string, newLabel: string) => void;
  onDeleted: (id: string) => void;
}

export function createColumns(
  t: ReturnType<typeof useTranslations>,
  { onRenamed, onDeleted }: ColumnCallbacks
): ColumnDef<TableRow>[] {
  return [
    {
      accessorKey: "label",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("tableNameColumn")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("label")}</span>
      ),
    },
    {
      accessorKey: "is_active",
      header: t("statusColumn"),
      cell: ({ row }) => {
        const isActive = row.getValue("is_active") as boolean;
        return (
          <Badge variant={isActive ? "default" : "outline"}>
            {isActive ? t("active") : t("inactive")}
          </Badge>
        );
      },
    },
    {
      id: "qr",
      header: t("qrColumn"),
      cell: ({ row }) => <QrCell table={row.original} t={t} />,
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <ActionsCell table={row.original} t={t} onRenamed={onRenamed} onDeleted={onDeleted} />
      ),
    },
  ];
}

function QrCell({
  table,
  t,
}: {
  table: TableRow;
  t: ReturnType<typeof useTranslations>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <QrCode className="size-4" />
        {t("viewQr")}
      </Button>
      <QrPreviewDialog
        open={open}
        onOpenChange={setOpen}
        tableIds={[table.id]}
        title={table.label}
      />
    </>
  );
}

function ActionsCell({
  table,
  t,
  onRenamed,
  onDeleted,
}: {
  table: TableRow;
  t: ReturnType<typeof useTranslations>;
  onRenamed: (id: string, newLabel: string) => void;
  onDeleted: (id: string) => void;
}) {
  const [showRename, setShowRename] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/admin/tables/${table.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete table");
      onDeleted(table.id);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting table:", error);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 w-8 p-0">
          <span className="sr-only">{t("openMenu")}</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={() => setShowRename(true)}>
              <Pencil className="mr-2 h-4 w-4" />
              {t("renameTable")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("delete")}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameTableDialog
        open={showRename}
        onOpenChange={setShowRename}
        tableId={table.id}
        currentLabel={table.label}
        onRenamed={onRenamed}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteTableTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteTableConfirm", { label: table.label })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel disabled={isDeleting}>
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
