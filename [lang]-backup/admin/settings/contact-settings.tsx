"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

interface ContactSettingsProps {
  tenant: Tenant;
}

export function ContactSettings({ tenant }: ContactSettingsProps) {
  const contactInfo = (tenant.contact_info as any) || {};

  const [address, setAddress] = useState(contactInfo.address || "");
  const [facebook, setFacebook] = useState(contactInfo.facebook || "");
  const [instagram, setInstagram] = useState(contactInfo.instagram || "");
  const [tiktok, setTiktok] = useState(contactInfo.tiktok || "");
  const [email, setEmail] = useState(contactInfo.email || "");
  const [whatsapp, setWhatsapp] = useState(contactInfo.whatsapp || "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

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
        throw new Error(data.error || "Failed to save contact settings");
      }

      setMessage("✓ Contact information saved successfully");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save contact information";
      setMessage(`✗ ${errorMessage}`);
      console.error("Error saving contact settings:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium">Address</label>
        <Textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter your restaurant address"
          rows={2}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="contact@restaurant.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">WhatsApp</label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+90 555 123 4567"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Facebook</label>
          <Input
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="facebook.com/yourpage"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Instagram</label>
          <Input
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@yourusername"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">TikTok</label>
          <Input
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            placeholder="@yourusername"
          />
        </div>
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
        {saving ? "Saving..." : "Save Contact Information"}
      </Button>
    </div>
  );
}
