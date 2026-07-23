"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { StatusSelect, type OrderStatus } from "./columns";
import { Phone, StickyNote, User } from "lucide-react";

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

interface OrderCardListProps {
  orders: Order[];
  statuses: OrderStatus[];
  onStatusChange: (orderId: string, statusId: number) => void;
}

export function OrderCardList({
  orders,
  statuses,
  onStatusChange,
}: OrderCardListProps) {
  const t = useTranslations("admin");

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <OrderCard
          key={order.id}
          order={order}
          statuses={statuses}
          onStatusChange={onStatusChange}
          t={t}
        />
      ))}
    </div>
  );
}

function OrderCard({
  order,
  statuses,
  onStatusChange,
  t,
}: {
  order: Order;
  statuses: OrderStatus[];
  onStatusChange: (orderId: string, statusId: number) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const time = new Date(order.created_at).toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const total = new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
  }).format(order.total_amount);

  return (
    <Card
      className="border-l-4"
      style={{ borderLeftColor: order.status.color }}
    >
      <CardHeader className="flex flex-row items-center justify-between">
        <span className="text-lg font-semibold">{order.table.label}</span>
        <span className="text-sm text-muted-foreground">{time}</span>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="space-y-1">
          {order.items.map((item) => (
            <p key={item.id} className="text-sm">
              {item.quantity}x {item.product_name}
            </p>
          ))}
        </div>

        {order.note && (
          <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
            <StickyNote className="mt-0.5 size-3.5 shrink-0" />
            <p>{order.note}</p>
          </div>
        )}

        {(order.customer_name || order.customer_phone) && (
          <div className="space-y-1 text-sm text-muted-foreground">
            {order.customer_name && (
              <div className="flex items-center gap-1.5">
                <User className="size-3.5 shrink-0" />
                <span>{order.customer_name}</span>
              </div>
            )}
            {order.customer_phone && (
              <div className="flex items-center gap-1.5">
                <Phone className="size-3.5 shrink-0" />
                <span>{order.customer_phone}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-between gap-2">
        <span className="text-base font-semibold">{total}</span>
        <StatusSelect
          t={t}
          status={order.status}
          statuses={statuses}
          onChange={(statusId) => onStatusChange(order.id, statusId)}
          className="h-10 w-auto min-w-36"
        />
      </CardFooter>
    </Card>
  );
}
