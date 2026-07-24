"use client";

import { usePathname } from "next/navigation";
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

  const renderOption = (language: string) => (
    <span className="flex items-center gap-2">
      <span className="text-base leading-none">{getLanguageFlag(language)}</span>
      <span className="text-sm">{getLanguageLabel(language)}</span>
    </span>
  );

  if (compact) {
    // Compact version: flag-only on mobile, flag + label on desktop
    return (
      <Select
        value={normalizedLang}
        onValueChange={(lang) => {
          if (!lang) return;
          window.location.href = getLanguagePath(lang);
        }}
      >
        <SelectTrigger
          aria-label={getLanguageLabel(normalizedLang)}
          className="h-9 w-auto justify-center gap-1.5 px-2.5 md:justify-between md:gap-2"
        >
          <span className="flex items-center gap-2">
            <span className="text-base leading-none">
              {getLanguageFlag(normalizedLang)}
            </span>
            <span className="hidden text-sm md:inline">
              {getLanguageLabel(normalizedLang)}
            </span>
          </span>
        </SelectTrigger>
        <SelectContent align="end">
          {availableLanguages.map((language) => (
            <SelectItem key={language} value={language}>
              {renderOption(language)}
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
      <SelectTrigger className="h-9 w-40">
        <SelectValue placeholder={getLanguageLabel(normalizedLang)}>
          {renderOption(normalizedLang)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {availableLanguages.map((language) => (
          <SelectItem key={language} value={language}>
            {renderOption(language)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
