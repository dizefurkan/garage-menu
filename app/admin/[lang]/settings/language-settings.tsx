"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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

interface LanguageSettingsProps {
  tenant: Tenant;
  currentLang: string;
  messages?: Record<string, string>;
}

export function LanguageSettings({
  tenant,
  currentLang,
  messages = {},
}: LanguageSettingsProps) {
  const router = useRouter();

  const t = (key: string, defaultValue: string = "") => {
    return (messages[key] as string) || defaultValue;
  };

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

  const handleDashboardLanguageChange = (value: string | null) => {
    if (value && value !== currentLang) {
      // Redirect immediately without saving to database
      router.push(`/admin/${value}/settings`);
    }
  };

  const getMenuLanguageLabel = (code: string) => {
    const lang = SUPPORTED_LANGUAGES.find((l) => l.code === code);
    return lang ? `${lang.name} (${lang.code})` : code;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (selectedLanguages.length === 0) {
      toast.error(t("minimumOneLanguageRequired", "At least one language is required"));
      setLoading(false);
      return;
    }

    // Check if default language is in selected languages
    if (!selectedLanguages.includes(defaultLanguage)) {
      toast.error(t("defaultLanguageMustBeSelected", "Default language must be one of the selected languages"));
      setLoading(false);
      return;
    }

    try {
      const previousDefaultLanguage = tenant.default_language || "en";
      const languageChanged =
        currentLang !== defaultLanguage &&
        defaultLanguage !== previousDefaultLanguage;

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
        throw new Error(t("failedToUpdateLanguages", "Failed to update languages"));
      }

      toast.success(t("menuLanguagesUpdatedSuccess", "Menu languages updated successfully!"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Dashboard Language */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("dashboardLanguage", "Dashboard Language")}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          {t("dashboardLanguageDescription", "Choose the language for your admin dashboard interface")}
        </p>
        <Select
          value={currentLang}
          onValueChange={handleDashboardLanguageChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("selectLanguagePlaceholder", "Select language")}>
              {currentLang === "en"
                ? t("englishEN", "English (EN)")
                : t("turkishTR", "Türkçe (TR)")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t("englishEN", "English (EN)")}</SelectItem>
            <SelectItem value="tr">{t("turkishTR", "Türkçe (TR)")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Menu Languages - Multi-Select with Popover */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("menuLanguages", "Menu Languages")}
        </label>
        <p className="text-xs text-gray-500 mb-3">
          {t("menuLanguagesDescription", "Select which languages will be available for your menu. At least one language is required.")}
        </p>

        {/* Available Languages - Multi-Select Combobox */}
        <LanguageCombobox
          selectedLanguages={selectedLanguages}
          onLanguagesChange={setSelectedLanguages}
        />
      </div>

      {/* Default Menu Language */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          {t("defaultMenuLanguage", "Default Menu Language")}
        </label>
        <p className="text-xs text-gray-500 mb-2">
          {t("defaultMenuLanguageDescription", "This language will be shown when visitors first access your menu.")}
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
                  ? t("selectOneLanguageFirst", "Select at least one language first")
                  : undefined
              }
            >
              {selectedLanguages.includes(defaultLanguage)
                ? getMenuLanguageLabel(defaultLanguage)
                : ""}
            </SelectValue>
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

      <Button type="submit" disabled={loading}>
        {loading ? t("savingLanguages", "Saving...") : t("saveLanguages", "Save Languages")}
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
