"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowUpDown,
  MoreHorizontal,
  Trash2,
  Edit2,
  TriangleAlert,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Image from "next/image";

export type Product = {
  id: number;
  name: string;
  price: number;
  currency: string;
  image_url: string | null;
  is_available: boolean;
  is_out_of_stock?: boolean;
  is_draft: boolean;
  created_at: string;
  categoryName?: string;
  contains_no_allergens?: boolean;
  allergen_count?: number;
};

export function createColumns(t: (key: string) => string): ColumnDef<Product>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('productName')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const imageUrl = row.original.image_url;
        const name = row.getValue("name") as string;
        const product = row.original;
        const router = useRouter();
        return (
          <div
            className="flex items-center gap-3 cursor-pointer hover:opacity-75 transition-opacity"
            onClick={() => router.push(`/admin/products/${product.id}`)}
          >
            {imageUrl ? (
              <div className="relative w-10 h-10 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                <Image
                  src={imageUrl}
                  alt={name}
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500 flex-shrink-0">
                —
              </div>
            )}
            <span className="truncate">{name}</span>
            {(product.allergen_count ?? 0) === 0 &&
              !product.contains_no_allergens && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <TriangleAlert
                        className="h-4 w-4 flex-shrink-0 text-amber-500"
                        aria-label={t("allergenInfoMissing")}
                      />
                    </TooltipTrigger>
                    <TooltipContent>
                      {t("allergenInfoMissing")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
          </div>
        );
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('price')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const price = parseFloat(row.getValue("price"));
        const currency = row.original.currency;
        const formatted = new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: currency,
        }).format(price);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "categoryName",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t('category')}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const categoryName = row.getValue("categoryName") as string;
        return <div className="font-medium">{categoryName}</div>;
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t('createdAt')}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-right">{date.toLocaleDateString("tr-TR")}</div>
        );
      },
    },
    {
      id: "status",
      header: ({ column }) => (
        <div className="text-right">
          <span className="text-sm font-medium">{t('status')}</span>
        </div>
      ),
      cell: ({ row }) => {
        const product = row.original;
        return <StatusCell product={product} />;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const product = row.original;
        return <ActionsCell product={product} />;
      },
    },
  ];
}

type ProductStatus = "on_sale" | "out_of_stock" | "hidden";

export const columns: ColumnDef<Product>[] = createColumns((key) => key);

function StatusCell({ product }: { product: Product }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [isToggling, setIsToggling] = useState(false);

  // Two booleans, one control. "hidden" wins over "out of stock" because an
  // unrendered product has nothing to label.
  const status: ProductStatus = !product.is_available
    ? "hidden"
    : product.is_out_of_stock
      ? "out_of_stock"
      : "on_sale";

  const handleStatusChange = async (next: ProductStatus) => {
    setIsToggling(true);
    try {
      // Fetch current product data to get translations
      const response = await fetch(`/api/admin/products/${product.id}`);
      if (!response.ok) throw new Error("Failed to fetch product");
      const currentProduct = await response.json();

      // Build translations object from product_translations
      const translations: Record<
        string,
        { name: string; description: string }
      > = {};
      for (const trans of currentProduct.product_translations || []) {
        translations[trans.language_code] = {
          name: trans.name,
          description: trans.description || "",
        };
      }

      // Update with new availability status
      const updateResponse = await fetch(`/api/admin/products/${product.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          price: currentProduct.price,
          currency: currentProduct.currency,
          category_id: currentProduct.category_id,
          image_url: currentProduct.image_url,
          is_available: next !== "hidden",
          is_out_of_stock: next === "out_of_stock",
          translations,
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.json();
        throw new Error(error.error || "Güncelleme başarısız");
      }

      router.refresh();
    } catch (error) {
      console.error("Toggle error:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Satış durumu güncellenirken hata oluştu"
      );
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="flex justify-end">
      <select
        value={status}
        onChange={(e) => handleStatusChange(e.target.value as ProductStatus)}
        disabled={isToggling}
        aria-label={t("availabilityTitle")}
        className="h-8 rounded-md border border-input bg-background px-2 text-xs disabled:opacity-50"
      >
        <option value="on_sale">{t("availabilityOnSale")}</option>
        <option value="out_of_stock">{t("availabilityOutOfStock")}</option>
        <option value="hidden">{t("availabilityHidden")}</option>
      </select>
    </div>
  );
}

function ActionsCell({ product }: { product: Product }) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEdit = () => {
    router.push(`/admin/products/${product.id}`);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/admin/products/${product.id}`, {
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
        error instanceof Error ? error.message : "Ürün silinirken hata oluştu"
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
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>İşlemler</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() =>
                navigator.clipboard.writeText(product.id.toString())
              }
            >
              Ürün ID'sini Kopyala
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
            <AlertDialogTitle>Ürünü sil</AlertDialogTitle>
            <AlertDialogDescription>
              "{product.name}" ürününü silmek istediğinizden emin misiniz? Bu
              işlem geri alınamaz.
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
