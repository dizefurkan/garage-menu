"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

interface GeneralSettingsProps {
  tenant: Tenant;
}

export function GeneralSettings({ tenant }: GeneralSettingsProps) {
  const router = useRouter();
  const t = useTranslations("settings");

  const [name, setName] = useState(tenant.name || "");
  const [email, setEmail] = useState(tenant.email || "");
  const [phone, setPhone] = useState(tenant.phone || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(t("nameRequired"));
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/admin/settings/general", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || t("failedToUpdateGeneral"));
      }

      toast.success(t("generalSaved"));
      // The venue name is rendered by the admin shell (sidebar header), which
      // is a server component — without this it keeps showing the old name.
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("failedToUpdateGeneral")
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("restaurantName")}
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Garage Chocolate"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">{t("email")}</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@restaurant.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">{t("phone")}</label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+90 555 123 4567"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("menuSlug")}
        </label>
        <Input value={tenant.slug} disabled />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("slugDescription", { slug: tenant.slug })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{t("slugLocked")}</p>
      </div>


      <Button onClick={handleSave} disabled={saving}>
        {saving ? t("saving") : t("saveChanges")}
      </Button>
    </div>
  );
}
