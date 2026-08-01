"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import type { Product } from "@/lib/menu-db";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter } from "lucide-react";
import type { RowSelectionState } from "@tanstack/react-table";
import { createColumns } from "./columns";
import { BulkActionsBar } from "./bulk-actions-bar";

interface ProductsFilterBarProps {
  tenantId: number;
  categories: Array<{ id: number; name: string; productCount?: number }>;
}

const PAGE_SIZE_OPTIONS = [5, 10, 20];
const DEFAULT_PAGE_SIZE = 10;

export function ProductsFilterBar({
  tenantId,
  categories: initialCategories,
}: ProductsFilterBarProps) {
  const t = useTranslations('admin');
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const currentLang = (params?.lang as string) || "en";

  // Get initial values from URL
  const initialPage = parseInt(searchParams.get("page") || "1");
  const initialCategory = searchParams.get("category") || "all";
  const initialPageSize = parseInt(searchParams.get("pageSize") || DEFAULT_PAGE_SIZE.toString());

  const [products, setProducts] = useState<Product[]>([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [selectedCategory, setSelectedCategory] =
    useState<string>(initialCategory);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [total, setTotal] = useState(0);
  const [totalAllProducts, setTotalAllProducts] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  // Owned here rather than inside DataTable so a page change doesn't wipe it —
  // keys are product ids (see getRowId below), which stay valid across pages.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Load products when component mounts or filters change
  const loadProducts = useCallback(
    async (page: number, categoryId?: number, size: number = pageSize) => {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams({
          page: page.toString(),
          pageSize: size.toString(),
          lang: currentLang,
        });
        if (categoryId) {
          queryParams.append("categoryId", categoryId.toString());
        }

        const response = await fetch(`/api/admin/products?${queryParams}`);
        if (!response.ok) {
          throw new Error("Failed to fetch products");
        }
        const result = await response.json();
        setProducts(result.products);
        setTotal(result.totalCount);
        setCurrentPage(result.currentPage);
        setPageCount(result.pageCount);
        return result.products.length as number;
      } catch (error) {
        console.error("Failed to load products:", error);
        setProducts([]);
        return 0;
      } finally {
        setIsLoading(false);
      }
    },
    [pageSize, currentLang]
  );

  // Initial load - fetch total all products and load initial page
  useEffect(() => {
    const categoryId =
      initialCategory === "all" ? undefined : parseInt(initialCategory);

    // Fetch total count of all products
    const fetchTotalAllProducts = async () => {
      try {
        const queryParams = new URLSearchParams({
          page: "1",
          pageSize: pageSize.toString(),
          lang: currentLang,
        });
        const response = await fetch(`/api/admin/products?${queryParams}`);
        if (response.ok) {
          const result = await response.json();
          setTotalAllProducts(result.totalCount);
        }
      } catch (error) {
        console.error("Failed to fetch total products:", error);
      }
    };

    fetchTotalAllProducts();
    loadProducts(initialPage, categoryId, pageSize);
  }, [loadProducts, initialPage, initialCategory, pageSize]);

  // Map products to format for DataTable
  const mappedProducts = useMemo(() => {
    return products.map((p) => ({
      ...p,
      categoryName: p.categories?.name || "No Category",
    }));
  }, [products]);

  const handlePaginationChange = (newPageIndex: number) => {
    const page = newPageIndex + 1;
    const categoryId =
      selectedCategory === "all" ? undefined : parseInt(selectedCategory);

    // Update URL
    const params = new URLSearchParams();
    params.set("page", page.toString());
    params.set("pageSize", pageSize.toString());
    if (selectedCategory !== "all") {
      params.set("category", selectedCategory);
    }
    router.push(`?${params.toString()}`);

    // Load products
    loadProducts(page, categoryId, pageSize);
  };

  const handleCategoryChange = (val: string | null) => {
    if (val) {
      setSelectedCategory(val);
      // Changing the filter changes what "selected" refers to; keeping ids
      // from the previous category would act on rows no longer on screen.
      setRowSelection({});
      const categoryId = val === "all" ? undefined : parseInt(val);

      // Update URL
      const params = new URLSearchParams();
      params.set("page", "1");
      if (val !== "all") {
        params.set("category", val);
      }
      params.set("pageSize", pageSize.toString());
      router.push(`?${params.toString()}`);

      // Load products
      loadProducts(1, categoryId, pageSize);
    }
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1);

    // Update URL
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", newSize.toString());
    if (selectedCategory !== "all") {
      params.set("category", selectedCategory);
    }
    router.push(`?${params.toString()}`);

    // Load products with new page size
    const categoryId = selectedCategory === "all" ? undefined : parseInt(selectedCategory);
    loadProducts(1, categoryId, newSize);
  };

  const filterElement = (
    <div
      suppressHydrationWarning
      className="flex h-10 items-center gap-2 rounded-md border border-input bg-background pl-3 pr-2"
    >
      <Filter className="h-4 w-4 text-muted-foreground" />
      <Select value={selectedCategory} onValueChange={handleCategoryChange}>
        <SelectTrigger className="h-full w-48 border-0 bg-transparent p-0 focus-visible:border-transparent focus-visible:ring-0 focus-visible:ring-offset-0">
          <SelectValue>
            {selectedCategory === "all"
              ? `${t('allCategories')} (${totalAllProducts})`
              : (() => {
                  const cat = initialCategories.find(
                    (c: any) => c.id.toString() === selectedCategory
                  );
                  return cat
                    ? `${cat.name} (${cat.productCount || 0})`
                    : selectedCategory;
                })()}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">
            {t('allCategories')} ({totalAllProducts})
          </SelectItem>
          {initialCategories.map((category: any) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name} ({category.productCount || 0})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (isLoading && products.length === 0) {
    return <div className="text-center py-8">{t('loadingAnalytics')}</div>;
  }

  const reloadCurrentPage = () =>
    loadProducts(
      currentPage,
      selectedCategory && selectedCategory !== "all"
        ? Number(selectedCategory)
        : undefined,
      pageSize
    );

  // Deleting every row on the last page leaves that page empty and stranded,
  // so fall back to the first page when the refetch comes back with nothing.
  const reloadAfterBulk = async () => {
    const loaded = await reloadCurrentPage();
    if (loaded === 0 && currentPage > 1) {
      handlePaginationChange(0);
    }
  };

  const selectedIds = Object.keys(rowSelection)
    .filter((id) => rowSelection[id])
    .map(Number);

  return (
    <DataTable
      columns={createColumns(t, reloadCurrentPage)}
      data={mappedProducts}
      filterElement={filterElement}
      filterPlaceholder={t('searchProducts')}
      initialPageIndex={currentPage - 1}
      onPaginationChange={handlePaginationChange}
      isLoading={isLoading}
      isServerSidePagination={true}
      totalPages={pageCount}
      totalCount={total}
      pageSize={pageSize}
      onPageSizeChange={handlePageSizeChange}
      pageSizeOptions={PAGE_SIZE_OPTIONS}
      showColumnToggle={false}
      enableRowSelection
      getRowId={(row) => String(row.id)}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      selectionToolbar={
        <BulkActionsBar
          selectedIds={selectedIds}
          onClear={() => setRowSelection({})}
          onDone={reloadAfterBulk}
        />
      }
    />
  );
}
