"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

interface ThemeSettingsProps {
  tenant: Tenant;
  messages?: Record<string, string>;
}

export function ThemeSettings({ tenant, messages = {} }: ThemeSettingsProps) {
  const t = (key: string, defaultValue: string = "") => {
    return (messages[key] as string) || defaultValue;
  };

  const themeConfig = (tenant.theme_config as {
    primary: string;
    secondary: string;
    accent?: string;
    font?: string;
  }) || {
    primary: "#000000",
    secondary: "#FFFFFF",
  };

  const [primary, setPrimary] = useState(themeConfig.primary);
  const [secondary, setSecondary] = useState(themeConfig.secondary);
  const [accent, setAccent] = useState(themeConfig.accent || "#808080");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch("/api/admin/settings/theme", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          theme_config: {
            primary,
            secondary,
            accent: accent || undefined,
          },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(
          data.error || t("failedToUpdate", "Failed to update theme")
        );
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="mb-3 block text-sm font-medium">
            {t("primaryColor", "Primary Color")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              className="h-12 w-20 cursor-pointer rounded border border-gray-200"
            />
            <input
              type="text"
              value={primary}
              onChange={(e) => setPrimary(e.target.value)}
              placeholder="#000000"
              className="flex h-10 w-32 rounded border border-input bg-background px-3 py-2 text-sm"
            />
            <span className="text-xs text-gray-500">
              Used for buttons and accents
            </span>
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            {t("secondaryColor", "Secondary Color")}
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              className="h-12 w-20 cursor-pointer rounded border border-gray-200"
            />
            <input
              type="text"
              value={secondary}
              onChange={(e) => setSecondary(e.target.value)}
              placeholder="#FFFFFF"
              className="flex h-10 w-32 rounded border border-input bg-background px-3 py-2 text-sm"
            />
            <span className="text-xs text-gray-500">Used for backgrounds</span>
          </div>
        </div>

        <div>
          <label className="mb-3 block text-sm font-medium">
            {t("accentColor", "Accent Color")} (Optional)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              className="h-12 w-20 cursor-pointer rounded border border-gray-200"
            />
            <input
              type="text"
              value={accent}
              onChange={(e) => setAccent(e.target.value)}
              placeholder="#808080"
              className="flex h-10 w-32 rounded border border-input bg-background px-3 py-2 text-sm"
            />
            <span className="text-xs text-gray-500">Used for highlights</span>
          </div>
        </div>
      </div>

      {/* Theme Preview */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <CardDescription className="mb-4 text-xs font-semibold text-gray-600">
            PREVIEW
          </CardDescription>
          <div className="flex gap-4">
            <div className="space-y-2">
              <div
                className="h-24 w-24 rounded border-2 border-gray-200"
                style={{ backgroundColor: primary }}
              />
              <p className="text-xs text-gray-600">Primary</p>
            </div>
            <div className="space-y-2">
              <div
                className="h-24 w-24 rounded border-2 border-gray-200"
                style={{ backgroundColor: secondary }}
              />
              <p className="text-xs text-gray-600">Secondary</p>
            </div>
            <div className="space-y-2">
              <div
                className="h-24 w-24 rounded border-2 border-gray-200"
                style={{ backgroundColor: accent }}
              />
              <p className="text-xs text-gray-600">Accent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-700">
          {t("themeSaved", "Theme settings updated successfully")}
        </div>
      )}

      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : t("saveChanges", "Save Theme")}
      </Button>
    </form>
  );
}
