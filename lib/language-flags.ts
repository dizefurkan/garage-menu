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
