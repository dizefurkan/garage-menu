"use client";

import { usePathname } from "next/navigation";
import { Globe } from "lucide-react";
import { getLanguageFlag } from "@/lib/language-flags";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSwitcherProps {
  currentLang?: string;
  compact?: boolean;
  languages?: string[];
}

export function LanguageSwitcher({
  currentLang = "en",
  compact = false,
  languages,
}: LanguageSwitcherProps) {
  const pathname = usePathname();
  const availableLanguages =
    languages && languages.length > 0 ? [...new Set(languages)] : ["en", "tr"];
  const normalizedLang = availableLanguages.includes(currentLang)
    ? currentLang
    : availableLanguages[0];

  const getLanguageLabel = (languageCode: string) => {
    try {
      const normalizedCode = languageCode.toLowerCase();
      const baseLanguage = normalizedCode.split("-")[0];
      const displayNames = new Intl.DisplayNames([normalizedCode], {
        type: "language",
      });

      return displayNames.of(baseLanguage) || languageCode.toUpperCase();
    } catch {
      return languageCode.toUpperCase();
    }
  };

  // Extract the current locale and construct paths for both languages
  const getLanguagePath = (lang: string) => {
    const parts = pathname.split("/").filter(Boolean);

    // For /admin/[lang]/... pages
    if (parts[0] === "admin" && parts.length >= 2) {
      // Replace locale at position 1
      parts[1] = lang;
      return "/" + parts.join("/");
    }

    // For /menu/[slug]/[lang]/... pages
    if (parts[0] === "menu" && parts.length >= 3) {
      // Replace locale at position 2
      parts[2] = lang;
      return "/" + parts.join("/");
    }

    // For /[lang] landing pages or unknown structure
    if (parts.length >= 1) {
      // Replace locale at position 0
      parts[0] = lang;
      return "/" + parts.join("/");
    }

    // Fallback to root locale
    return `/${lang}`;
  };

  if (compact) {
    // Compact version: icon-based dropdown
    return (
      <Select
        value={normalizedLang}
        onValueChange={(lang) => {
          if (!lang) return;
          window.location.href = getLanguagePath(lang);
        }}
      >
        <SelectTrigger className="h-9 w-9 md:w-36 gap-2 md:gap-2 justify-center md:justify-start">
          <Globe className="h-4 w-4 text-muted-foreground" />
          <span className="hidden md:inline truncate text-sm">
            {getLanguageFlag(normalizedLang)} {getLanguageLabel(normalizedLang)}
          </span>
        </SelectTrigger>
        <SelectContent>
          {availableLanguages.map((language) => (
            <SelectItem key={language} value={language}>
              {getLanguageFlag(language)} {getLanguageLabel(language)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Full version: Dropdown select
  return (
    <Select
      value={normalizedLang}
      onValueChange={(lang) => {
        if (!lang) return;
        window.location.href = getLanguagePath(lang);
      }}
    >
      <SelectTrigger className="w-40">
        <SelectValue placeholder={getLanguageLabel(normalizedLang)} />
      </SelectTrigger>
      <SelectContent>
        {availableLanguages.map((language) => (
          <SelectItem key={language} value={language}>
            {getLanguageFlag(language)} {getLanguageLabel(language)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
