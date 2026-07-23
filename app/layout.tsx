import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
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
      <body className={cn("font-sans", inter.variable)}>
        {children}
        <Toaster closeButton />
      </body>
    </html>
  );
}
