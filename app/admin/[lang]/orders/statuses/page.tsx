"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { DataTable } from "@/components/ui/data-table";
import { Loader2 } from "lucide-react";
import { createColumns, type StatusRow } from "./columns";

export default function OrderStatusesPage() {
  const t = useTranslations("admin");
  const [statuses, setStatuses] = useState<StatusRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStatuses();
  }, []);

  async function fetchStatuses() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/order-statuses?all=true");
      if (!res.ok) throw new Error("Failed to fetch statuses");
      const data = await res.json();
      setStatuses(data.statuses || []);
    } catch (error) {
      console.error("Error fetching statuses:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleToggled(id: number, isEnabled: boolean) {
    setStatuses((prev) =>
      prev.map((status) =>
        status.id === id ? { ...status, is_enabled: isEnabled } : status
      )
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("statusesTitle")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("statusesDescription")}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : (
        <DataTable
          columns={createColumns(t, { onToggled: handleToggled })}
          data={statuses}
          filterColumnId="label"
          filterPlaceholder={t("searchStatus")}
          showColumnToggle={false}
        />
      )}
    </div>
  );
}
