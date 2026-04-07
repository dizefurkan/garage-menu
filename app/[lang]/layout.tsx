import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";

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

  // Validate locale
  if (!["en", "tr"].includes(lang)) {
    notFound();
  }

  return <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>;
}
