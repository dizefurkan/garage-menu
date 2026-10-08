"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

interface ContactSettingsProps {
  tenant: Tenant;
}

export function ContactSettings({ tenant }: ContactSettingsProps) {
  const t = useTranslations("settings");

  const contactInfo = (tenant.contact_info as any) || {};

  const [address, setAddress] = useState(contactInfo.address || "");
  const [facebook, setFacebook] = useState(contactInfo.facebook || "");
  const [instagram, setInstagram] = useState(contactInfo.instagram || "");
  const [tiktok, setTiktok] = useState(contactInfo.tiktok || "");
  const [email, setEmail] = useState(contactInfo.email || "");
  const [whatsapp, setWhatsapp] = useState(contactInfo.whatsapp || "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/settings/contact`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address,
          facebook,
          instagram,
          tiktok,
          email,
          whatsapp,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", data);
        throw new Error(data.error || t("failedToUpdate"));
      }

      toast.success(t("contactSaved"));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t("failedToUpdate");
      toast.error(errorMessage);
      console.error("Error saving contact settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">{t("address")}</label>
        <Textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("addressPlaceholder")}
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">{t("email")}</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@restaurant.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("whatsapp")}
          </label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder={t("whatsappPlaceholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("facebook")}
          </label>
          <Input
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder={t("facebookPlaceholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("instagram")}
          </label>
          <Input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder={t("instagramPlaceholder")}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            {t("tiktok")}
          </label>
          <Input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder={t("tiktokPlaceholder")}
          />
        </div>
      </div>


      <Button onClick={handleSave} disabled={saving}>
        {saving ? t("saving") : t("saveChanges")}
      </Button>
    </div>
  );
}
