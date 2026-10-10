import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

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

  // Otherwise, treat as menu slug - redirect to default language
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    console.log(`[SlugPage] Fetching default language for slug: ${slug}`);
    const response = await fetch(
      `${baseUrl}/api/public/default-language?slug=${slug}`,
      {
        next: { revalidate: 3600 },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      console.error(
        `[SlugPage] API returned ${response.status} for slug: ${slug}`
      );
      notFound();
    }

    const data = await response.json();
    const defaultLanguage = data.defaultLanguage || "en";

    // The visitor's device language wins when the menu offers it; otherwise
    // fall back to the venue's default language.
    const deviceLanguage = pickDeviceLanguage(
      (await headers()).get("accept-language"),
      Array.isArray(data.languages) ? data.languages : [defaultLanguage]
    );
    const language = deviceLanguage || defaultLanguage;

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
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[SlugPage] Error:", error);
    notFound();
  }
}
