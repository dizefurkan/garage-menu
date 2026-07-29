// Flag emoji for each supported menu language (conventional flag per language)
const LANGUAGE_FLAGS: Record<string, string> = {
  en: "🇬🇧",
  tr: "🇹🇷",
  de: "🇩🇪",
  fr: "🇫🇷",
  es: "🇪🇸",
  it: "🇮🇹",
  pt: "🇵🇹",
  ja: "🇯🇵",
  zh: "🇨🇳",
  ru: "🇷🇺",
  ar: "🇸🇦",
};

export function getLanguageFlag(languageCode: string): string {
  const baseLanguage = languageCode.toLowerCase().split("-")[0];
  return LANGUAGE_FLAGS[baseLanguage] || "🌐";
}

/**
 * Language name in that language itself (endonym), for tab labels and
 * pickers where the user is choosing which translation to edit.
 *
 * Replaces a `lang === "en" ? "English" : "Türkçe"` ternary that was copied
 * into four admin forms — it labelled every non-English tab "Türkçe", so a
 * venue with German or French translations saw the wrong name on the tab.
 *
 * Falls back to the uppercased code so an unlisted language degrades to
 * "NL" rather than a wrong name.
 */
const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  tr: "Türkçe",
  de: "Deutsch",
  fr: "Français",
  es: "Español",
  it: "Italiano",
  pt: "Português",
  ja: "日本語",
  zh: "中文",
  ru: "Русский",
  ar: "العربية",
};

export function getLanguageName(languageCode: string): string {
  const baseLanguage = languageCode.toLowerCase().split("-")[0];
  return LANGUAGE_NAMES[baseLanguage] || languageCode.toUpperCase();
}
