"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterPlaceholder?: string;
  filterColumnId?: string;
  filterElement?: React.ReactNode;
  initialPageIndex?: number;
  onPaginationChange?: (pageIndex: number) => void;
  isServerSidePagination?: boolean;
  totalPages?: number;
  totalCount?: number;
  isLoading?: boolean;
  pageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  showColumnToggle?: boolean;
  useFixedLayout?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterPlaceholder = "Filtrele...",
  filterColumnId = "name",
  filterElement,
  initialPageIndex = 0,
  onPaginationChange,
  isServerSidePagination = false,
  totalPages = 1,
  totalCount = 0,
  isLoading = false,
  useFixedLayout = false,
  pageSize: serverPageSize,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 20],
  showColumnToggle = true,
}: DataTableProps<TData, TValue>) {
  const t = useTranslations('admin');
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [pagination, setPagination] = React.useState({
    pageIndex: initialPageIndex,
    pageSize: 5,
  });
  const isExternalSync = React.useRef(false);

  // Sync with URL when it changes (browser back/forward)
  React.useEffect(() => {
    isExternalSync.current = true;
    setPagination((prev) => ({
      ...prev,
      pageIndex: initialPageIndex,
    }));
  }, [initialPageIndex]);

  // Reset pagination when data changes (e.g., due to filtering)
  React.useEffect(() => {
    setPagination((prev) => ({
      ...prev,
      pageIndex: 0,
    }));
  }, [data.length]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: isServerSidePagination
      ? undefined
      : getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      const newState =
        typeof updater === "function"
          ? updater({
              pageIndex: pagination.pageIndex,
              pageSize: pagination.pageSize,
            })
          : updater;
      setPagination(newState);
      // Only call callback for user-initiated changes, not external URL syncs
      if (onPaginationChange && !isExternalSync.current) {
        onPaginationChange(newState.pageIndex);
      }
      isExternalSync.current = false;
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      pagination: isServerSidePagination ? undefined : pagination,
    },
    manualPagination: isServerSidePagination,
    pageCount: isServerSidePagination ? totalPages : undefined,
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input
          placeholder={filterPlaceholder}
          value={
            (table.getColumn(filterColumnId)?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn(filterColumnId)?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />

        {filterElement}

        {showColumnToggle && (
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ml-auto">
              {t('columnsButton')} <ChevronDown className="ml-2 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuGroup>
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="rounded-md border">
        <Table className={useFixedLayout ? "table-fixed" : undefined}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={
                        useFixedLayout
                          ? { width: header.getSize() }
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={
                        useFixedLayout
                          ? { width: cell.column.getSize() }
                          : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {t('noResults')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {(() => {
        const displayTotalPages = isServerSidePagination
          ? totalPages
          : (() => {
              const pageSize = table.getState().pagination.pageSize;
              const totalRows = table.getFilteredRowModel().rows.length;
              return Math.ceil(totalRows / pageSize) || 1;
            })();
        const hasMultiplePages = displayTotalPages > 1;
        const currentPageIndex = isServerSidePagination
          ? initialPageIndex
          : pagination.pageIndex;

        const goToPage = (pageIndex: number) => {
          const target = Math.max(0, Math.min(displayTotalPages - 1, pageIndex));
          if (isServerSidePagination) {
            onPaginationChange?.(target);
          } else {
            table.setPageIndex(target);
          }
        };

        const summary = (() => {
          if (isServerSidePagination) {
            return totalCount === 0
              ? t('noProducts')
              : t('totalProducts', { count: totalCount });
          }
          const pageSize = table.getState().pagination.pageSize;
          const totalRows = table.getFilteredRowModel().rows.length;
          const pageIndex = table.getState().pagination.pageIndex;
          const startRow = totalRows === 0 ? 0 : pageIndex * pageSize + 1;
          const endRow = Math.min(startRow + pageSize - 1, totalRows);

          if (totalRows === 0) {
            return t('items', { count: 0 });
          }
          return `${startRow}-${endRow} / ${totalRows}`;
        })();

        return (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {summary}
            </div>
            <div className="flex items-center gap-6 lg:gap-8">
              {(!isServerSidePagination || onPageSizeChange) && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {t('rowsPerPage')}
                  </span>
                  <Select
                    value={`${
                      isServerSidePagination
                        ? serverPageSize || pageSizeOptions[0]
                        : table.getState().pagination?.pageSize || pageSizeOptions[0]
                    }`}
                    onValueChange={(value) => {
                      if (!value) return;
                      if (isServerSidePagination) {
                        onPageSizeChange?.(Number(value));
                      } else {
                        table.setPageSize(Number(value));
                      }
                    }}
                  >
                    <SelectTrigger size="sm" className="w-16">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {pageSizeOptions.map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {hasMultiplePages && (
                <>
                  <div className="flex w-fit items-center justify-center text-sm font-medium">
                    {t('pageInfo', {
                      current: currentPageIndex + 1,
                      total: displayTotalPages,
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="hidden size-8 lg:flex"
                      onClick={() => goToPage(0)}
                      disabled={currentPageIndex === 0 || isLoading}
                    >
                      <span className="sr-only">{t('goToFirstPage')}</span>
                      <ChevronsLeft />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => goToPage(currentPageIndex - 1)}
                      disabled={currentPageIndex === 0 || isLoading}
                    >
                      <span className="sr-only">{t('goToPreviousPage')}</span>
                      <ChevronLeft />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      onClick={() => goToPage(currentPageIndex + 1)}
                      disabled={
                        currentPageIndex >= displayTotalPages - 1 || isLoading
                      }
                    >
                      <span className="sr-only">{t('goToNextPage')}</span>
                      <ChevronRight />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="hidden size-8 lg:flex"
                      onClick={() => goToPage(displayTotalPages - 1)}
                      disabled={
                        currentPageIndex >= displayTotalPages - 1 || isLoading
                      }
                    >
                      <span className="sr-only">{t('goToLastPage')}</span>
                      <ChevronsRight />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
