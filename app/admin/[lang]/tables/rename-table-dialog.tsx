"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface RenameTableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableId: string;
  currentLabel: string;
  onRenamed: (id: string, newLabel: string) => void;
}

export function RenameTableDialog({
  open,
  onOpenChange,
  tableId,
  currentLabel,
  onRenamed,
}: RenameTableDialogProps) {
  const t = useTranslations("admin");
  const [label, setLabel] = useState(currentLabel);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setLabel(currentLabel);
  }, [open, currentLabel]);

  async function handleSave() {
    if (!label.trim()) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/admin/tables/${tableId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim() }),
      });
      if (!res.ok) throw new Error("Failed to rename table");
      onRenamed(tableId, label.trim());
      onOpenChange(false);
    } catch (error) {
      console.error("Error renaming table:", error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t("renameTable")}</DialogTitle>
        </DialogHeader>
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={t("tableNamePlaceholder")}
          autoFocus
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("cancel")}
          </Button>
          <Button onClick={handleSave} disabled={saving || !label.trim()}>
            {saving && <Loader2 className="size-4 animate-spin" />}
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
