import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  experimental: {
    // Lets <ViewTransition> animate route and content changes
    viewTransition: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
};

// Picks up ./i18n/request.ts, which is what makes `next-intl/server` APIs
// (getTranslations, setRequestLocale) work in server components.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
