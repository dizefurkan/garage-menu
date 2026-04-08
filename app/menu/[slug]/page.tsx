import { notFound, redirect } from "next/navigation";

// Allow dynamic route generation for any slug
export const dynamicParams = true;

// List of known locales to distinguish from menu slugs
const KNOWN_LOCALES = ["en", "tr"];

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // If slug is a known locale, redirect to landing page
  if (KNOWN_LOCALES.includes(slug)) {
    redirect(`/${slug}`);
  }

  // Otherwise, treat as menu slug - redirect to default language
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

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

    // Redirect to menu with default language
    redirect(`/menu/${slug}/${defaultLanguage}`);
  } catch (error) {
    // Re-throw Next.js redirect errors
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error;
    }
    console.error("[SlugPage] Error:", error);
    notFound();
  }
}
