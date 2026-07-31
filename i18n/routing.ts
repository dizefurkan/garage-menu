import { defineRouting } from "next-intl/routing";

/**
 * Single source of truth for the locales this app serves.
 *
 * Note that we deliberately do NOT use next-intl's `createMiddleware` or
 * `createNavigation` on top of this. Those assume the locale is always the
 * first path segment, and ours is not: the public menu lives at
 * `/menu/[slug]/[lang]`, where the locale comes last. `middleware.ts` handles
 * our three URL shapes itself, and pages hand the locale to next-intl via
 * `setRequestLocale()` instead.
 */
export const routing = defineRouting({
  locales: ["en", "tr"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];
