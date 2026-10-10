/**
 * The language a guest picked by hand on the public menu. Remembered in a
 * cookie so the next /menu/{slug} visit (a rescanned QR, say) reopens in that
 * language instead of the device or venue default. Only an explicit pick sets
 * it: merely opening /menu/{slug}/tr from a printed QR does not.
 *
 * Read server-side in app/menu/[slug]/page.tsx and checked against the
 * languages the venue actually offers, so a stale value is harmless.
 */
export const MENU_LANGUAGE_COOKIE = "menu_lang";

export function rememberMenuLanguage(language: string): void {
  try {
    document.cookie = `${MENU_LANGUAGE_COOKIE}=${encodeURIComponent(
      language
    )}; path=/menu; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
  } catch {
    // cookies blocked: remembering is a nicety
  }
}
