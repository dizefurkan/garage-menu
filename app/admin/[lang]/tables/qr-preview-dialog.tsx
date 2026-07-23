"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Printer } from "lucide-react";

interface QrData {
  id: string;
  label: string;
  url: string;
}

interface QrPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tableIds: string[];
  title: string;
}

export function QrPreviewDialog({
  open,
  onOpenChange,
  tableIds,
  title,
}: QrPreviewDialogProps) {
  const t = useTranslations("admin");
  const [qrData, setQrData] = useState<QrData[]>([]);
  const [loading, setLoading] = useState(false);

  // `onOpenChange` only fires for Radix-internal interactions (Escape,
  // overlay click, DialogClose) — it is never called when a parent opens
  // this dialog programmatically via the `open` prop. Fetching must react
  // to `open` itself instead.
  useEffect(() => {
    if (!open || tableIds.length === 0) return;

    let cancelled = false;
    setQrData([]);
    setLoading(true);

    (async () => {
      try {
        const params = tableIds.map((id) => `tableIds=${id}`).join("&");
        const res = await fetch(`/api/admin/tables/qr-export?${params}`);
        const data = await res.json();
        if (!cancelled) setQrData(data.qr_data || []);
      } catch (error) {
        console.error("Error loading QR preview:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [open, tableIds]);

  function handlePrint() {
    const params = tableIds.map((id) => `tableIds=${id}`).join("&");
    window.open(
      `/api/admin/tables/qr-export?format=html&${params}`,
      "_blank"
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t("qrPreviewDescription")}</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <div className="grid max-h-96 grid-cols-2 gap-4 overflow-y-auto sm:grid-cols-3">
            {qrData.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center gap-2 rounded-lg border p-3 text-center"
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(item.url)}`}
                  alt={item.label}
                  className="size-32"
                />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="size-4" />
            {t("printQr")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
