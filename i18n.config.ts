import { getRequestConfig } from "next-intl/server";
import { ReactNode } from "react";

const KNOWN_LOCALES = ["en", "tr"] as const;

/**
 * Config object export for next-intl
 * This provides messages and locale to server and client components
 */
export default getRequestConfig(async ({ requestLocale }) => {
  // Get locale - can come from URL param or be default
  // requestLocale is set by middleware or is the default
  let locale = (await requestLocale) || "en";

  // Validate locale
  if (!KNOWN_LOCALES.includes(locale as any)) {
    locale = "en";
  }

  try {
    // Load messages for this locale
    const messages = (await import(`@/messages/${locale}.json`)).default;
    return {
      locale,
      messages,
      // Fixed timeZone so server and client render dates identically
      // (otherwise next-intl falls back to the environment's local
      // timeZone on each side, which can differ and break hydration).
      timeZone: "Europe/Istanbul",
    };
  } catch (error) {
    console.error(
      `[i18n] Failed to load messages for locale: ${locale}`,
      error
    );
    // Fallback to English
    const fallbackMessages = (await import(`@/messages/en.json`)).default;
    return {
      locale: "en",
      messages: fallbackMessages,
      timeZone: "Europe/Istanbul",
    };
  }
});
