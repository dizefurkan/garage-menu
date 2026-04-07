"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
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
}

export function LanguageSwitcher({
  currentLang = "en",
  compact = false,
}: LanguageSwitcherProps) {
  const pathname = usePathname();

  // Extract the current locale and construct paths for both languages
  const getLanguagePath = (lang: "en" | "tr") => {
    const KNOWN_LOCALES = ["en", "tr"];
    const parts = pathname.split("/").filter(Boolean);
    
    // For /admin/[lang]/... pages
    if (parts[0] === "admin" && parts.length >= 2 && KNOWN_LOCALES.includes(parts[1])) {
      // Replace locale at position 1
      parts[1] = lang;
      return "/" + parts.join("/");
    }
    
    // For /menu/[slug]/[lang]/... pages
    if (parts[0] === "menu" && parts.length >= 3 && KNOWN_LOCALES.includes(parts[2])) {
      // Replace locale at position 2
      parts[2] = lang;
      return "/" + parts.join("/");
    }
    
    // For /[lang] landing pages or unknown structure
    if (parts.length >= 1 && KNOWN_LOCALES.includes(parts[0])) {
      // Replace locale at position 0
      parts[0] = lang;
      return "/" + parts.join("/");
    }
    
    // Fallback to root locale
    return `/${lang}`;
  };

  if (compact) {
    // Compact version: Just show EN | TR links
    return (
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={getLanguagePath("en")}
          className={`px-2 py-1 rounded ${
            currentLang === "en"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          EN
        </Link>
        <span className="text-muted-foreground">|</span>
        <Link
          href={getLanguagePath("tr")}
          className={`px-2 py-1 rounded ${
            currentLang === "tr"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          TR
        </Link>
      </div>
    );
  }

  // Full version: Dropdown select
  return (
    <Select value={currentLang} onValueChange={(lang) => {
      window.location.href = getLanguagePath(lang as "en" | "tr");
    }}>
      <SelectTrigger className="w-[100px]">
        <SelectValue placeholder="Language" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="tr">Türkçe</SelectItem>
      </SelectContent>
    </Select>
  );
}
