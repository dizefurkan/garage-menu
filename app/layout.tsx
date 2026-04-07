import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  fallback: ["Inter Fallback"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://garage-menu.vercel.app"),
  title: "Digital Menu Management",
  description:
    "Modern QR menu management system for restaurants, cafes, and businesses",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="module"
          src="https://cdn.jsdelivr.net/npm/emoji-picker-element@1"
        ></script>
      </head>
      <body className={cn("font-sans", inter.variable)}>{children}</body>
    </html>
  );
}
