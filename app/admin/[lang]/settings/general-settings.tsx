"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

interface GeneralSettingsProps {
  tenant: Tenant;
  messages?: Record<string, string>;
}

export function GeneralSettings({
  tenant,
  messages = {},
}: GeneralSettingsProps) {
  const router = useRouter();
  const t = (key: string, defaultValue: string = "") =>
    messages[key] || defaultValue;

  const [name, setName] = useState(tenant.name || "");
  const [email, setEmail] = useState(tenant.email || "");
  const [phone, setPhone] = useState(tenant.phone || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage(`✗ ${t("nameRequired", "Business name is required")}`);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/settings/general", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            t("failedToUpdateGeneral", "Failed to update business information")
        );
      }

      setMessage(
        `✓ ${t("generalSaved", "Business information saved successfully")}`
      );
      setTimeout(() => setMessage(""), 3000);
      // The venue name is rendered by the admin shell (sidebar header), which
      // is a server component — without this it keeps showing the old name.
      router.refresh();
    } catch (error) {
      setMessage(
        `✗ ${
          error instanceof Error
            ? error.message
            : t("failedToUpdateGeneral", "Failed to update business information")
        }`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("restaurantName", "Restaurant Name")}
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Garage Chocolate"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("email", "Email")}
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="info@restaurant.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("phone", "Phone")}
          </label>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+90 555 123 4567"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("menuSlug", "Menu Slug")}
        </label>
        <Input value={tenant.slug} disabled />
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("slugDescription", "Your public menu URL: /{slug}/en").replace(
            "{slug}",
            tenant.slug
          )}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t(
            "slugLocked",
            "This address cannot be changed — your printed QR codes depend on it."
          )}
        </p>
      </div>

      {message && (
        <div
          className={`rounded-lg p-3 text-sm font-medium ${
            message.startsWith("✓")
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {message}
        </div>
      )}

      <Button onClick={handleSave} disabled={saving}>
        {saving ? t("saving", "Saving...") : t("saveChanges", "Save Changes")}
      </Button>
    </div>
  );
}
