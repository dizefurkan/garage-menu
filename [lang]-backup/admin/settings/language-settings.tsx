"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

export function LanguageSettings({ tenant }: { tenant: Tenant }) {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(
    tenant.languages || ["en"]
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
        {["en", "tr"].map((lang) => (
          <div key={lang} className="flex items-center gap-2">
            <Checkbox
              id={`lang-${lang}`}
              checked={selectedLanguages.includes(lang)}
              onCheckedChange={() => handleLanguageChange(lang)}
            />
            <label
              htmlFor={`lang-${lang}`}
              className="text-sm cursor-pointer font-medium"
            >
              {lang === "en" ? "English" : "Türkçe"}
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
