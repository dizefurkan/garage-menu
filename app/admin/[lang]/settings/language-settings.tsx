"use client";

import * as React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
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

  const [selectedLanguages, setSelectedLanguages] =
    useState<string[]>(parsedLanguages);
  const [defaultLanguage, setDefaultLanguage] = useState<string>(
    tenant.default_language || "en"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ensure default language is in selected languages
  React.useEffect(() => {
    if (
      selectedLanguages.length > 0 &&
      !selectedLanguages.includes(defaultLanguage)
    ) {
      setDefaultLanguage(selectedLanguages[0]);
    }
  }, [selectedLanguages, defaultLanguage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (selectedLanguages.length === 0) {
      setError("At least one language is required");
      setLoading(false);
      return;
    }

    // Check if default language is in selected languages
    if (!selectedLanguages.includes(defaultLanguage)) {
      setError("Default language must be one of the selected languages");
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
          default_language: defaultLanguage,
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
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Available Languages - Multi-Select with Popover */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Available Languages
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Select which languages will be available for your menu. At least one
          language is required.
        </p>

        {/* Available Languages - Multi-Select Combobox */}
        <LanguageCombobox
          selectedLanguages={selectedLanguages}
          onLanguagesChange={setSelectedLanguages}
        />
      </div>

      {/* Default Language */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Default Language
        </label>
        <p className="text-xs text-gray-500 mb-2">
          This language will be shown when visitors first access your menu.
        </p>
        <Select
          value={
            selectedLanguages.includes(defaultLanguage) ? defaultLanguage : ""
          }
          onValueChange={(value) => {
            if (value) setDefaultLanguage(value);
          }}
          disabled={selectedLanguages.length === 0}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                selectedLanguages.length === 0
                  ? "Select at least one language first"
                  : undefined
              }
              render={() => {
                const lang = SUPPORTED_LANGUAGES.find(
                  (l) => l.code === defaultLanguage
                );
                return lang ? `${lang.name} (${lang.code})` : defaultLanguage;
              }}
            />
          </SelectTrigger>
          <SelectContent>
            {selectedLanguages.map((lang) => {
              const langInfo = SUPPORTED_LANGUAGES.find((l) => l.code === lang);
              return (
                <SelectItem key={lang} value={lang}>
                  {langInfo?.name} ({lang})
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
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

/**
 * Language Combobox Component - Multi-select with chips
 */
interface LanguageComboboxProps {
  selectedLanguages: string[];
  onLanguagesChange: (languages: string[]) => void;
}

function LanguageCombobox({
  selectedLanguages,
  onLanguagesChange,
}: LanguageComboboxProps) {
  const anchor = useComboboxAnchor();

  // Ensure at least one language is always selected
  const handleLanguageChange = (languages: string[]) => {
    if (languages.length > 0) {
      onLanguagesChange(languages);
    }
  };

  return (
    <Combobox
      multiple
      autoHighlight
      items={SUPPORTED_LANGUAGES.map((lang) => lang.code)}
      value={selectedLanguages}
      onValueChange={handleLanguageChange}
    >
      <ComboboxChips ref={anchor} className="w-full">
        <ComboboxValue>
          {(values: string[]) => (
            <React.Fragment>
              {values.map((langCode: string) => {
                const lang = SUPPORTED_LANGUAGES.find(
                  (l) => l.code === langCode
                );
                return (
                  <ComboboxChip
                    key={langCode}
                    value={langCode}
                    onRemove={() => {
                      const updated = selectedLanguages.filter(
                        (l) => l !== langCode
                      );
                      if (updated.length > 0) {
                        handleLanguageChange(updated);
                      }
                    }}
                  >
                    {lang?.name} ({langCode})
                  </ComboboxChip>
                );
              })}
              <ComboboxChipsInput placeholder="Add language..." />
            </React.Fragment>
          )}
        </ComboboxValue>
      </ComboboxChips>
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>No languages found.</ComboboxEmpty>
        <ComboboxList>
          {(langCode: string) => {
            const lang = SUPPORTED_LANGUAGES.find((l) => l.code === langCode);
            return (
              <ComboboxItem key={langCode} value={langCode}>
                {lang?.name} ({langCode})
              </ComboboxItem>
            );
          }}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
