"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

// All supported languages in the system
const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English" },
  { code: "tr", name: "Türkçe" },
  { code: "de", name: "Deutsch" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "it", name: "Italiano" },
  { code: "pt", name: "Português" },
  { code: "ja", name: "日本語" },
  { code: "zh", name: "中文" },
  { code: "ru", name: "Русский" },
  { code: "ar", name: "العربية" },
];

export function LanguageSettings({ tenant }: { tenant: Tenant }) {
  // Parse tenant languages safely (can be array or JSON string)
  let parsedLanguages: string[] = ["en"];
  if (tenant.languages) {
    if (Array.isArray(tenant.languages)) {
      parsedLanguages = tenant.languages;
    } else if (typeof tenant.languages === "string") {
      try {
        parsedLanguages = JSON.parse(tenant.languages);
      } catch {
        parsedLanguages = ["en"];
      }
    }
  }

  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    parsedLanguages
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguages((prev) => {
      if (prev.includes(lang)) {
        // Don't allow removing all languages
        if (prev.length === 1) return prev;
        return prev.filter((l) => l !== lang);
      }
      return [...prev, lang];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (selectedLanguages.length === 0) {
      setError("At least one language is required");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/admin/settings/languages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: tenant.id,
          languages: selectedLanguages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update languages");
      }

      alert("Languages updated successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-gray-600 mb-3">
        Select which languages will be available for your menu. At least one
        language is required.
      </p>
      <div className="space-y-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <div key={lang.code} className="flex items-center gap-2">
            <Checkbox
              id={`lang-${lang.code}`}
              checked={selectedLanguages.includes(lang.code)}
              onCheckedChange={() => handleLanguageChange(lang.code)}
            />
            <label
              htmlFor={`lang-${lang.code}`}
              className="text-sm cursor-pointer font-medium"
            >
              {lang.name} ({lang.code})
            </label>
          </div>
        ))}
      </div>
      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Saving..." : "Save Languages"}
      </Button>
    </form>
  );
}
