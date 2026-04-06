import { notFound, redirect } from "next/navigation";

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const response = await fetch(
      `${baseUrl}/api/public/default-language?slug=${slug}`,
      { next: { revalidate: 3600 } }
    );

    if (!response.ok) {
      notFound();
    }

    const data = await response.json();
    const defaultLanguage = data.defaultLanguage || "en";

    // Redirect to first language
    redirect(`/${slug}/${defaultLanguage}`);
  } catch (error) {
    // Re-throw Next.js redirect errors
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    console.error("[SlugPage] Error:", error);
    notFound();
  }
}
