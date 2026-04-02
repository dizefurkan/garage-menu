import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { Playfair_Display, Inter, Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
  locale,
}: {
  locale?: "tr" | "en";
} = {}): Metadata {
  const lang = locale && translations[locale] ? locale : "en";
  const t = translations[lang];

  const baseUrl = "https://garage-menu.vercel.app";

  return {
    metadataBase: new URL(baseUrl),

    title: {
      default: t.title,
      template: `%s | ${t.title}`,
    },

    description: t.description,

    keywords: [
      "chocolate",
      "croissant",
      "artisan bakery",
      "garage chocolate",
      "kruvasan",
      "çikolata",
      "el yapımı kruvasan",
    ],

    authors: [{ name: "Garage Chocolate & Croissant" }],

    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },

    alternates: {
      canonical: baseUrl,
      languages: {
        en: `${baseUrl}?lang=en`,
        tr: `${baseUrl}?lang=tr`,
      },
    },

    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },

    openGraph: {
      title: t.title,
      description: t.description,
      url: baseUrl,
      siteName: t.title,
      images: [
        {
          url: `${baseUrl}/garagechoco.jpg`,
          width: 1200,
          height: 630,
          alt: t.title,
        },
      ],
      locale: t.ogLocale,
      type: "website",
    },

    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: [`${baseUrl}/garagechoco.jpg`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={cn("font-sans", geist.variable)}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Bakery",
              name: "Garage Chocolate & Croissant",
              image: "https://garage-menu.vercel.app/garagechoco.jpg",
              url: "https://garage-menu.vercel.app",
              telephone: "+905385730401",
              address: {
                "@type": "PostalAddress",
                streetAddress: "Ahmediyeh Mah. Necmeddin Okyay Sok. No:44/B",
                addressLocality: "İstanbul",
                addressCountry: "TR",
              },
              servesCuisine: ["Chocolate", "Croissant", "Bakery"],
              priceRange: "$$",
              sameAs: [
                "https://www.instagram.com/garagexcroissant/",
                "https://www.instagram.com/garagexchocolate/",
              ],
              geo: {
                "@type": "GeoCoordinates",
                latitude: 41.01875142451296,
                longitude: 29.01835386498314,
              },
              openingHoursSpecification: [
                {
                  "@type": "OpeningHoursSpecification",
                  dayOfWeek: [
                    "Monday",
                    "Tuesday",
                    "Wednesday",
                    "Thursday",
                    "Friday",
                    "Saturday",
                  ],
                  opens: "08:00",
                  closes: "22:00",
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${playfair.variable} ${inter.variable} font-body`}>
        <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
      </body>
    </html>
  );
}
