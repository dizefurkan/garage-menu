import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Playfair_Display, Inter } from "next/font/google";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

// localized metadata helper
const translations = {
  en: {
    title: "Garage Chocolate & Croissant",
    description:
      "Delight in handcrafted chocolate croissants and artisanal treats at Garage Chocolate & Croissant.",
    ogLocale: "en_US",
  },
  tr: {
    title: "Garage Çikolata & Kruvasan",
    description:
      "Garage Çikolata & Kruvasan'da el yapımı çikolata kruvasanlar ve özel lezzetlerin tadını çıkarın.",
    ogLocale: "tr_TR",
  },
};

export function generateMetadata({
  params,
  searchParams,
  locale,
}: {
  params: Record<string, any>;
  searchParams: URLSearchParams;
  locale?: "tr" | "en";
}): Metadata {
  const lang = locale && translations[locale] ? locale : "en";
  const t = translations[lang];

  return {
    title: t.title,
    description: t.description,
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
    openGraph: {
      title: t.title,
      description: t.description,
      url: "https://garage-menu.example.com", // update with real URL
      siteName: "Garage Chocolate & Croissant",
      images: [
        {
          url: "https://garage-menu.example.com/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Garage Chocolate & Croissant Logo",
        },
      ],
      locale: t.ogLocale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: ["https://garage-menu.example.com/og-image.jpg"],
      creator: "@YourTwitterHandle",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body className={`${playfair.variable} ${inter.variable} font-body`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </body>
    </html>
  );
}
