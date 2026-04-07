"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { ArrowUpDown, MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Category = {
  id: number;
  name: string;
  is_draft: boolean;
  created_at: string;
  productCount?: number;
};

export const columns: ColumnDef<Category>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Kategori Adı
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "productCount",
    header: "Ürün Sayısı",
    cell: ({ row }) => {
      const count = row.getValue("productCount") as number;
      return (
        <span className="inline-block rounded-full bg-blue-100 text-blue-800 px-3 py-1 text-xs font-medium">
          {count} ürün
        </span>
      );
    },
  },
  {
    accessorKey: "is_draft",
    header: "Durum",
    cell: ({ row }) => {
      const isDraft = row.getValue("is_draft");
      return (
        <span
          className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
            isDraft
              ? "bg-yellow-100 text-yellow-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {isDraft ? "Taslak" : "Yayınlı"}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: "Oluşturulma Tarihi",
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return date.toLocaleDateString("tr-TR");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const category = row.original;
      return <ActionsCell category={category} />;
    },
  },
];

function ActionsCell({ category }: { category: Category }) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/admin/categories/${category.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/categories/${category.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Silme başarısız");
      }

      setShowDeleteDialog(false);
      router.refresh();
    } catch (error) {
      console.error("Delete error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Kategori silinirken hata oluştu"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-8 w-8 p-0">
          <span className="sr-only">Menüyü aç</span>
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(category.id.toString())
              }
            >
              Kategori ID'sini Kopyala
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Düzenle
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Sil
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kategoriyi sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{category.name}" kategorisini silmek istediğinizden emin misiniz?
              Bu kategoriye ait ürünler etkilenebilir. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel disabled={isDeleting}>İptal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Siliniyor..." : "Sil"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
