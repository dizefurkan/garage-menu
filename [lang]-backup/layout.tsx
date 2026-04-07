import type { Metadata } from "next";
import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import "@/app/globals.css";
import { Geist, Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const geistHeading = Geist({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-heading",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://garage-menu.vercel.app"),
  title: "Digital Menu",
  description: "Modern QR menu management for restaurants",
};

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  // Validate locale
  if (!["en", "tr"].includes(lang)) {
    notFound();
  }

  // Load messages for this locale directly
  const messages = (await import(`@/messages/${lang}.json`)).default;

  return (
    <html lang={lang}>
      <head>
        <script type="module" src="https://cdn.jsdelivr.net/npm/emoji-picker-element@1"></script>
      </head>
      <body
        className={cn(
          "font-sans",
          geist.variable,
          geistHeading.variable,
          inter.variable,
          "font-body"
        )}
      >
        <NextIntlClientProvider locale={lang} messages={messages}>
          <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
