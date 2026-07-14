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
import { ChevronDown } from "lucide-react";

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
    pageSize: 20,
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
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
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
                    <TableCell key={cell.id}>
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

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{t('rowsPerPage')}:</span>
          <select
            value={table.getState().pagination.pageSize}
            onChange={(e) => {
              table.setPageSize(Number(e.target.value));
            }}
            className="border border-input rounded px-2 py-1 text-sm"
          >
            {[5, 10, 20].map((pageSize) => (
              <option key={pageSize} value={pageSize}>
                {pageSize}
              </option>
            ))}
          </select>
        </div>
        <div className="text-sm text-muted-foreground">
          {(() => {
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
            const calculatedTotalPages = Math.ceil(totalRows / pageSize) || 1;

            if (totalRows === 0) {
              return t('items', { count: 0 });
            }
            return `${startRow}-${endRow} / ${totalRows} • ${t('pageInfo', { current: pageIndex + 1, total: calculatedTotalPages })}`;
          })()}
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

          return hasMultiplePages ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const prevPage = Math.max(0, currentPageIndex - 1);
                  onPaginationChange?.(prevPage);
                }}
                disabled={currentPageIndex === 0 || isLoading}
              >
                {t('previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentPageIndex + 1} / {displayTotalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextPage = Math.min(
                    displayTotalPages - 1,
                    currentPageIndex + 1
                  );
                  onPaginationChange?.(nextPage);
                }}
                disabled={
                  currentPageIndex >= displayTotalPages - 1 || isLoading
                }
              >
                {t('next')}
              </Button>
            </div>
          ) : null;
        })()}
      </div>
    </div>
  );
}
