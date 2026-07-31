import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

/**
 * Request-scoped i18n config, discovered by `createNextIntlPlugin()` in
 * next.config.ts.
 *
 * `requestLocale` is normally populated by next-intl's middleware. We don't use
 * it (see i18n/routing.ts), so it is populated by the `setRequestLocale()` call
 * in each locale-scoped layout instead.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    // Fixed timeZone so server and client render dates identically (otherwise
    // next-intl falls back to the environment's local timeZone on each side,
    // which can differ and break hydration).
    timeZone: "Europe/Istanbul",
  };
});
