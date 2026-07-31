import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

export const metadata: Metadata = {
  metadataBase: new URL("https://garage-menu.vercel.app"),
  title: "Digital Menu",
  description: "Modern QR menu management for restaurants",
};

export default async function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;

  if (!hasLocale(routing.locales, lang)) {
    notFound();
  }

  setRequestLocale(lang);

  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}
