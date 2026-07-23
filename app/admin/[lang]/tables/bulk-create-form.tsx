"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface BulkCreateFormProps {
  onCreated: (tables: any[]) => void;
}

export function BulkCreateForm({ onCreated }: BulkCreateFormProps) {
  const t = useTranslations("admin");
  const [creating, setCreating] = useState(false);
  const [bulkCount, setBulkCount] = useState(5);

  async function createBulkTables() {
    try {
      setCreating(true);
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: bulkCount }),
      });

      if (!res.ok) throw new Error("Failed to create tables");
      const data = await res.json();

      if (data.success) {
        onCreated(data.tables || []);
        setBulkCount(5);
      }
    } catch (error) {
      console.error("Error creating tables:", error);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex gap-3">
      <Input
        type="number"
        min="1"
        max="100"
        value={bulkCount}
        onChange={(e) => setBulkCount(parseInt(e.target.value))}
        placeholder={t("tableCountPlaceholder")}
        className="w-32"
      />
      <Button onClick={createBulkTables} disabled={creating || bulkCount < 1} className="gap-2">
        {creating && <Loader2 className="size-4 animate-spin" />}
        {t("createTablesCount", { count: bulkCount })}
      </Button>
    </div>
  );
}
