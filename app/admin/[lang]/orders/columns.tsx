"use client";

import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowUpDown } from "lucide-react";

export interface OrderStatus {
  id: number;
  key: string;
  label: string;
  color: string;
}

export interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}

export interface OrderRow {
  id: string;
  tableLabel: string;
  status: OrderStatus;
  note: string;
  total_amount: number;
  created_at: string;
  items: OrderItem[];
}

const MAX_VISIBLE_ITEMS = 2;

// Default seeded statuses (see docs/migrations/009_add_orders_system.sql)
// are looked up via i18n by their stable `key`; tenant-created custom
// statuses have no matching key, so they fall back to the DB `label`.
export function getStatusLabel(
  t: ReturnType<typeof useTranslations>,
  status: OrderStatus
): string {
  const i18nKey = `statusKey_${status.key}`;
  return t.has(i18nKey) ? t(i18nKey) : status.label;
}

export function StatusSelect({
  t,
  status,
  statuses,
  onChange,
  className,
}: {
  t: ReturnType<typeof useTranslations>;
  status: OrderStatus;
  statuses: OrderStatus[];
  onChange: (statusId: number) => void;
  className?: string;
}) {
  // If this order's current status was since disabled, it won't be
  // in `statuses` — include it anyway so the Select can still show
  // (and keep) the order's real status instead of rendering blank.
  const options = statuses.some((s) => s.id === status.id)
    ? statuses
    : [...statuses, status];

  return (
    <Select
      value={status.id.toString()}
      onValueChange={(value) => {
        if (value) onChange(parseInt(value, 10));
      }}
    >
      <SelectTrigger className={className ?? "h-9 w-full"}>
        <SelectValue>
          <span
            className="size-2 shrink-0 rounded-full mt-auto mb-auto"
            style={{ backgroundColor: status.color }}
          />
          {getStatusLabel(t, status)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.id} value={option.id.toString()}>
            <span
              className="size-2 shrink-0 rounded-full mt-auto mb-auto"
              style={{ backgroundColor: option.color }}
            />
            {getStatusLabel(t, option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function createColumns(
  t: ReturnType<typeof useTranslations>,
  statuses: OrderStatus[],
  onStatusChange: (orderId: string, statusId: number) => void
): ColumnDef<OrderRow>[] {
  return [
    {
      accessorKey: "tableLabel",
      header: t("tableColumn"),
      size: 110,
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("tableLabel")}</span>
      ),
    },
    {
      id: "items",
      header: t("orderColumn"),
      size: 240,
      cell: ({ row }) => {
        const items = row.original.items;
        const visible = items.slice(0, MAX_VISIBLE_ITEMS);
        const remaining = items.length - visible.length;
        const fullList = items
          .map((item) => `${item.quantity}x ${item.product_name}`)
          .join(", ");

        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="cursor-default text-sm">
                  {visible
                    .map((item) => `${item.quantity}x ${item.product_name}`)
                    .join(", ")}
                  {remaining > 0 && (
                    <span className="text-muted-foreground">
                      {" "}
                      {t("moreItems", { count: remaining })}
                    </span>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>{fullList}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      id: "note",
      header: t("noteColumn"),
      size: 200,
      cell: ({ row }) => {
        const note = row.original.note;
        if (!note) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }

        const text = (
          <p className="line-clamp-2 max-w-56 cursor-default text-sm">{note}</p>
        );

        // Short notes fit fully within 2 lines already — only wrap
        // longer ones in a tooltip so nothing important is ever hidden.
        const NOTE_TRUNCATE_THRESHOLD = 70;
        if (note.length <= NOTE_TRUNCATE_THRESHOLD) {
          return text;
        }

        return (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>{text}</TooltipTrigger>
              <TooltipContent className="max-w-xs">{note}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      },
    },
    {
      accessorKey: "total_amount",
      size: 120,
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("totalColumn")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const amount = row.getValue("total_amount") as number;
        const formatted = new Intl.NumberFormat("tr-TR", {
          style: "currency",
          currency: "TRY",
        }).format(amount);
        return <div className="text-right font-medium">{formatted}</div>;
      },
    },
    {
      accessorKey: "created_at",
      size: 100,
      header: ({ column }) => (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            {t("timeColumn")}
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      ),
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"));
        return (
          <div className="text-right text-sm text-muted-foreground">
            {date.toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        );
      },
    },
    {
      id: "status",
      header: t("statusColumn"),
      size: 220,
      cell: ({ row }) => {
        const order = row.original;
        return (
          <StatusSelect
            t={t}
            status={order.status}
            statuses={statuses}
            onChange={(statusId) => onStatusChange(order.id, statusId)}
          />
        );
      },
    },
  ];
}
