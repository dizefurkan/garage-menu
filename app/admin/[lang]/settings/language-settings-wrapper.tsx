"use client";

import dynamic from "next/dynamic";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

// Dynamic import for client-only rendering (avoids hydration mismatch with Base UI)
const LanguageSettings = dynamic(
  () =>
    import("./language-settings").then((mod) => ({
      default: mod.LanguageSettings,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
    ),
  }
);

export function LanguageSettingsWrapper({
  tenant,
  currentLang,
  messages,
}: {
  tenant: Tenant;
  currentLang: string;
  messages?: Record<string, string>;
}) {
  return (
    <LanguageSettings
      tenant={tenant}
      currentLang={currentLang}
      messages={messages}
    />
  );
}
