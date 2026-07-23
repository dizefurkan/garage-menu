"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTenant } from "@/lib/context/tenant-context";
import { Loader2, Plus, QrCode, Table2 } from "lucide-react";
import { createColumns, type TableRow } from "./columns";
import { BulkCreateForm } from "./bulk-create-form";
import { QrPreviewDialog } from "./qr-preview-dialog";

export default function TablesPage() {
  const t = useTranslations("admin");
  const tenant = useTenant();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showPrintAllDialog, setShowPrintAllDialog] = useState(false);

  useEffect(() => {
    fetchTables();
  }, [tenant]);

  async function fetchTables() {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/tables");
      if (!res.ok) throw new Error("Failed to fetch tables");
      const data = await res.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error("Error fetching tables:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreated(newTables: TableRow[]) {
    setTables((prev) => [...prev, ...newTables]);
    setShowAddDialog(false);
  }

  function handleRenamed(id: string, newLabel: string) {
    setTables((prev) =>
      prev.map((table) => (table.id === id ? { ...table, label: newLabel } : table))
    );
  }

  function handleDeleted(id: string) {
    setTables((prev) => prev.filter((table) => table.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("tablesTitle")}</h1>

        {!loading && tables.length > 0 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowPrintAllDialog(true)}
            >
              <QrCode className="size-4" />
              {t("printAllQr")}
            </Button>
            <Button size="sm" className="gap-2" onClick={() => setShowAddDialog(true)}>
              <Plus className="size-4" />
              {t("addTables")}
            </Button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="size-6 animate-spin" />
        </div>
      ) : tables.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-dashed bg-card p-12 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-muted">
            <Table2 className="size-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">{t("noTablesTitle")}</h2>
            <p className="text-muted-foreground">{t("noTablesDescription")}</p>
          </div>
          <BulkCreateForm onCreated={handleCreated} />
        </div>
      ) : (
        <DataTable
          columns={createColumns(t, { onRenamed: handleRenamed, onDeleted: handleDeleted })}
          data={tables}
          filterColumnId="label"
          filterPlaceholder={t("searchTable")}
          showColumnToggle={false}
        />
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("addTables")}</DialogTitle>
          </DialogHeader>
          <BulkCreateForm onCreated={handleCreated} />
        </DialogContent>
      </Dialog>

      <QrPreviewDialog
        open={showPrintAllDialog}
        onOpenChange={setShowPrintAllDialog}
        tableIds={tables.map((table) => table.id)}
        title={t("allTablesQr")}
      />
    </div>
  );
}
