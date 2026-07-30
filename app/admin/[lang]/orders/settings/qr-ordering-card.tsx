"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";

interface QrOrderingCardProps {
  initialEnabled: boolean;
}

/**
 * Venue-controlled switch for QR ordering.
 *
 * Note this is not the same thing as the orders_management addon: the addon
 * decides whether the venue has the feature at all, this decides whether it is
 * on right now. Turning it off leaves the menu as a read-only showcase.
 */
export function QrOrderingCard({ initialEnabled }: QrOrderingCardProps) {
  const t = useTranslations("orderSettings.qrOrdering");
  const [enabled, setEnabled] = useState(initialEnabled);
  const [saving, setSaving] = useState(false);

  async function handleChange(next: boolean) {
    // Optimistic: the switch should feel instant, but roll back if the
    // request fails so the UI never claims a state the server rejected.
    const previous = enabled;
    setEnabled(next);
    setSaving(true);

    try {
      const res = await fetch("/api/admin/settings/qr-ordering", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qr_ordering_enabled: next }),
      });

      if (!res.ok) throw new Error("Request failed");
    } catch (error) {
      console.error("[QrOrderingCard] Failed to save:", error);
      setEnabled(previous);
      toast.error(t("saveError"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-6 space-y-4">
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={handleChange}
          disabled={saving}
          aria-label={t("switchLabel")}
        />
      </div>

      <div className="flex items-center gap-2 rounded bg-muted p-3 text-sm">
        <span
          className={`size-2 shrink-0 rounded-full ${
            enabled ? "bg-emerald-500" : "bg-muted-foreground/40"
          }`}
        />
        <span className="font-medium">
          {enabled ? t("statusOn") : t("statusOff")}
        </span>
        <span className="text-muted-foreground">
          {enabled ? t("statusOnHint") : t("statusOffHint")}
        </span>
      </div>
    </div>
  );
}
