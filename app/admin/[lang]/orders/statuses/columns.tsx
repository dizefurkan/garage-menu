"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ArrowUpDown, Loader2 } from "lucide-react";
import { getStatusLabel } from "../columns";

export interface StatusRow {
  id: number;
  key: string;
  label: string;
  color: string;
  sort_order: number;
  is_default_seed: boolean;
  is_enabled: boolean;
}

interface ColumnCallbacks {
  onToggled: (id: number, isEnabled: boolean) => void;
}

export function createColumns(
  t: ReturnType<typeof useTranslations>,
  { onToggled }: ColumnCallbacks
): ColumnDef<StatusRow>[] {
  return [
    {
      accessorKey: "label",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          {t("statusNameColumn")}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className="size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: row.original.color }}
          />
          <span className="font-medium">
            {getStatusLabel(t, row.original)}
          </span>
        </div>
      ),
    },
    {
      id: "toggle",
      header: t("enabledColumn"),
      cell: ({ row }) => (
        <ToggleCell status={row.original} onToggled={onToggled} />
      ),
    },
  ];
}

function ToggleCell({
  status,
  onToggled,
}: {
  status: StatusRow;
  onToggled: (id: number, isEnabled: boolean) => void;
}) {
  const [isSaving, setIsSaving] = useState(false);

  async function handleChange(checked: boolean) {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/admin/order-statuses/${status.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_enabled: checked }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      onToggled(status.id, checked);
    } catch (error) {
      console.error("Error toggling status:", error);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Switch
        checked={status.is_enabled}
        onCheckedChange={handleChange}
        disabled={isSaving}
      />
      {isSaving && <Loader2 className="size-3.5 animate-spin text-muted-foreground" />}
    </div>
  );
}
