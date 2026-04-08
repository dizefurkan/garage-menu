import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

function getBaseUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
}

interface Props {
  params: Promise<{
    slug: string;
    lang: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lang } = await params;
  const baseUrl = getBaseUrl();

  return {
    title: `Menu | ${slug}`,
    description: "Browse our menu",
    alternates: {
      canonical: `${baseUrl}/menu/${slug}/${lang}`,
      languages: {
        en: `${baseUrl}/menu/${slug}/en`,
        tr: `${baseUrl}/menu/${slug}/tr`,
      },
    },
  };
}

// Allow routes not in generateStaticParams to be generated on-demand (ISR)
export const dynamicParams = true;

export async function generateStaticParams() {
  // Hardcoded fallback for main menu
  const fallbackParams = [
    { slug: "garage-chocolate-croissant", lang: "en" },
    { slug: "garage-chocolate-croissant", lang: "tr" },
  ];

  try {
    // Only attempt if environment variables are available
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.warn(
        "[generateStaticParams] Credentials missing - using fallback"
      );
      return fallbackParams;
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Fetch all tenants with their languages
    const { data: tenants, error } = await supabaseAdmin
      .from("tenants")
      .select("slug, languages");

    if (error || !tenants) {
      console.error("[generateStaticParams] Error:", error);
      return fallbackParams;
    }

    // Generate params for all tenant/language combinations
    const params = tenants.flatMap((tenant: any) => {
      const languages = tenant.languages || ["en"];
      return languages.map((lang: string) => ({
        slug: tenant.slug,
        lang: lang,
      }));
    });

    return params;
  } catch (error) {
    console.error("[generateStaticParams] Error:", error);
    return fallbackParams;
  }
}

export default async function MenuPage({ params }: Props) {
  const { slug, lang } = await params;

  // Validate language
  if (!["en", "tr"].includes(lang)) {
    notFound();
  }

  // TEST: Just return simple page to verify route works
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>✅ Route Works!</h1>
      <p>
        <strong>Slug:</strong> {slug}
      </p>
      <p>
        <strong>Language:</strong> {lang}
      </p>
      <p>
        <strong>Base URL:</strong> {getBaseUrl()}
      </p>
      <hr />
      <p>This is a test page. The route /menu/[slug]/[lang] IS working!</p>
    </div>
  );
}
