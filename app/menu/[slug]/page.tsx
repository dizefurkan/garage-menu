import { cookies, headers } from "next/headers";
import { MENU_LANGUAGE_COOKIE } from "@/lib/menu-language";
import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase";

// Allow dynamic route generation for any slug
export const dynamicParams = true;

// List of known locales to distinguish from menu slugs
const KNOWN_LOCALES = ["en", "tr"];

/**
 * Picks the menu language for a first visit: the first language in the
 * browser's Accept-Language list (in the visitor's own order of preference)
 * that the menu offers. "tr-TR" matches "tr". Null when nothing matches.
 */
function pickDeviceLanguage(
  acceptLanguage: string | null,
  available: string[]
): string | null {
  if (!acceptLanguage) return null;

  const requested = acceptLanguage
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag: tag.trim().toLowerCase(), q: q ? Number(q.split("=")[1]) : 1 };
    })
    .filter((entry) => entry.tag && entry.tag !== "*" && entry.q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of requested) {
    const exact = available.find((lang) => lang.toLowerCase() === tag);
    if (exact) return exact;
    const base = tag.split("-")[0];
    const byBase = available.find(
      (lang) => lang.toLowerCase().split("-")[0] === base
    );
    if (byBase) return byBase;
  }
  return null;
}

export default async function SlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  console.log(`[SlugPage] Rendering for slug: ${slug}`);

  // If slug is a known locale, redirect to landing page
  if (KNOWN_LOCALES.includes(slug)) {
    console.log(`[SlugPage] Slug is a known locale, redirecting to /${slug}`);
    redirect(`/${slug}`);
  }

  // Otherwise, treat as menu slug - redirect to a language. Read the tenant
  // directly: fetching our own API over VERCEL_URL hits the protected
  // deployment URL and comes back 401, which used to surface as a 404.
  try {
    if (!supabaseAdmin) notFound();
    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .select("languages, default_language")
      .eq("slug", slug)
      .single();

    if (error || !tenant) {
      console.error(`[SlugPage] No tenant for slug: ${slug}`, error);
      notFound();
    }

    const defaultLanguage =
      tenant.default_language || tenant.languages?.[0] || "en";
    const data = { languages: tenant.languages };

    // Order of preference: the language the guest picked by hand before, then
    // their device language, then the venue's default. Each is only used if
    // the menu actually offers it.
    const available: string[] = Array.isArray(data.languages)
      ? data.languages
      : [defaultLanguage];
    const remembered = (await cookies()).get(MENU_LANGUAGE_COOKIE)?.value;
    const language =
      (remembered && available.includes(remembered) ? remembered : null) ||
      pickDeviceLanguage((await headers()).get("accept-language"), available) ||
      defaultLanguage;

    // Carry the query along: QR codes arrive as /menu/{slug}?tableId=...
    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === "string") qs.set(key, value);
      else if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : "";

    redirect(`/menu/${slug}/${language}${suffix}`);
  } catch (error) {
    // Re-throw Next.js redirect errors
    if (
      error instanceof Error &&
      (error.message.includes("NEXT_REDIRECT") ||
        (error as { digest?: string }).digest?.startsWith("NEXT_"))
    ) {
      throw error;
    }
    console.error("[SlugPage] Error:", error);
    notFound();
  }
}
