"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useTenant } from "@/lib/context/tenant-context";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser-client";
import { DataTable } from "@/components/ui/data-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  createColumns,
  getStatusLabel,
  type OrderStatus,
  type OrderRow,
} from "./columns";
import { OrderCardList } from "./order-card-list";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_PAGE_SIZE = 20;

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  table: { id: string; label: string };
  status: OrderStatus;
  note: string;
  total_amount: number;
  customer_name?: string;
  customer_phone?: string;
  created_at: string;
  items: OrderItem[];
}

interface TableOption {
  id: string;
  label: string;
}

export default function OrdersPage() {
  const t = useTranslations("admin");
  const tenant = useTenant();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statuses, setStatuses] = useState<OrderStatus[]>([]);
  const [tableOptions, setTableOptions] = useState<TableOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [statusCounts, setStatusCounts] = useState<Record<number, number>>({});
  const [allCount, setAllCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [pageCount, setPageCount] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [supabase] = useState(() => createBrowserSupabaseClient());

  // Counts (per status + "all") are computed server-side independent of
  // pagination, so tab badges always reflect true totals — not just
  // whatever happens to be on the currently loaded page of rows.
  const fetchOrders = useCallback(
    async (page: number, statusId: string, tableId: string, size: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          pageSize: size.toString(),
        });
        if (statusId !== "all") params.set("statusId", statusId);
        if (tableId !== "all") params.set("tableId", tableId);

        const res = await fetch(`/api/admin/orders?${params}`);
        if (!res.ok) throw new Error("Failed to fetch orders");
        const data = await res.json();
        setOrders(data.orders || []);
        setTotalCount(data.totalCount || 0);
        setPageCount(data.pageCount || 1);
        setCurrentPage(data.currentPage || 1);
        setStatusCounts(data.statusCounts || {});
        setAllCount(data.allCount || 0);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  async function fetchStatuses() {
    try {
      const res = await fetch("/api/admin/order-statuses");
      if (!res.ok) throw new Error("Failed to fetch statuses");
      const data = await res.json();
      setStatuses(data.statuses || []);
    } catch (error) {
      console.error("Error fetching statuses:", error);
    }
  }

  async function fetchTableOptions() {
    try {
      const res = await fetch("/api/admin/tables");
      if (!res.ok) throw new Error("Failed to fetch tables");
      const data = await res.json();
      setTableOptions(
        (data.tables || [])
          .map((table: any) => ({ id: table.id, label: table.label }))
          .sort((a: TableOption, b: TableOption) =>
            a.label.localeCompare(b.label)
          )
      );
    } catch (error) {
      console.error("Error fetching tables:", error);
    }
  }

  useEffect(() => {
    if (!tenant?.id) return;
    fetchStatuses();
    fetchTableOptions();
  }, [tenant?.id]);

  useEffect(() => {
    if (!tenant?.id) return;
    fetchOrders(1, statusFilter, tableFilter, pageSize);
    // Changing a filter always resets back to page 1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant?.id, statusFilter, tableFilter, pageSize]);

  useEffect(() => {
    if (!tenant?.id) return;

    let cleanup: (() => void) | undefined;
    let cancelled = false;

    subscribeToOrders().then((fn) => {
      if (cancelled) {
        fn?.();
      } else {
        cleanup = fn;
      }
    });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [tenant?.id]);

  async function subscribeToOrders() {
    if (!tenant?.id) return;

    // Ensure the session (and therefore the JWT used for Realtime's RLS
    // authorization) is loaded before we open the channel — otherwise the
    // subscribe can race ahead of auth and silently receive nothing.
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      (supabase as any).realtime.setAuth(session.access_token);
    }

    const channel = (supabase as any)
      .channel(`orders:${tenant.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          // Sound + toast notification is handled globally in
          // AdminLayoutClient so it fires from any admin page, not just
          // this one — here we only need to refresh the list.
          fetchOrders(currentPage, statusFilter, tableFilter, pageSize);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          fetchOrders(currentPage, statusFilter, tableFilter, pageSize);
        }
      )
      .subscribe((status: string) => {
        console.log("[Orders realtime] subscription status:", status);
      });

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }

  async function updateOrderStatus(orderId: string, statusId: number) {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status_id: statusId }),
      });

      if (!res.ok) throw new Error("Failed to update order status");
      const data = await res.json();

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? data.order : o))
      );
      // The order's status (and therefore the tab counts) changed.
      fetchOrders(currentPage, statusFilter, tableFilter, pageSize);
    } catch (error) {
      console.error("Error updating order status:", error);
    }
  }

  function handlePaginationChange(newPageIndex: number) {
    fetchOrders(newPageIndex + 1, statusFilter, tableFilter, pageSize);
  }

  const tableFilterSelect = (
    <Select value={tableFilter} onValueChange={(v) => v && setTableFilter(v)}>
      <SelectTrigger className="data-[size=default]:h-10 w-44">
        <SelectValue placeholder={t("filterByTable")}>
          {tableFilter === "all"
            ? t("allTables")
            : tableOptions.find((table) => table.id === tableFilter)?.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t("allTables")}</SelectItem>
        {tableOptions.map((table) => (
          <SelectItem key={table.id} value={table.id}>
            {table.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("ordersTitle")}</h1>
      </div>

      <div className="overflow-x-auto -mx-1 px-1">
        <Tabs value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
          <TabsList className="w-max">
            <TabsTrigger value="all" className="gap-1.5">
              {t("allStatuses")}
              <Badge variant="secondary">{allCount}</Badge>
            </TabsTrigger>
            {statuses.map((status) => (
              <TabsTrigger
                key={status.id}
                value={status.id.toString()}
                className="gap-1.5"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                />
                {getStatusLabel(t, status)}
                <Badge variant="secondary">
                  {statusCounts[status.id] || 0}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {loading && orders.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable
              columns={createColumns(t, statuses, updateOrderStatus)}
              data={orders.map(
                (order): OrderRow => ({
                  id: order.id,
                  tableLabel: order.table.label,
                  status: order.status,
                  note: order.note,
                  total_amount: order.total_amount,
                  created_at: order.created_at,
                  items: order.items,
                })
              )}
              filterColumnId="tableLabel"
              filterPlaceholder={t("searchTable")}
              showColumnToggle={false}
              useFixedLayout
              isServerSidePagination
              initialPageIndex={currentPage - 1}
              onPaginationChange={handlePaginationChange}
              totalPages={pageCount}
              totalCount={totalCount}
              isLoading={loading}
              pageSize={pageSize}
              onPageSizeChange={(size) => setPageSize(size)}
              pageSizeOptions={PAGE_SIZE_OPTIONS}
              filterElement={tableFilterSelect}
            />
          </div>

          <div className="space-y-4 md:hidden">
            {tableFilterSelect}
            <OrderCardList
              orders={orders}
              statuses={statuses}
              onStatusChange={updateOrderStatus}
            />
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => handlePaginationChange(currentPage - 2)}
              >
                <ChevronLeft className="size-4" />
                {t("previous")}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t("pageInfo", { current: currentPage, total: pageCount })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= pageCount}
                onClick={() => handlePaginationChange(currentPage)}
              >
                {t("next")}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
