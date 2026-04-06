"use client";

import { createContext, useContext } from "react";
import type { Database } from "@/lib/database.types";

type Tenant = Database["public"]["Tables"]["tenants"]["Row"];

const TenantContext = createContext<Tenant | null>(null);

export function TenantProvider({
  children,
  tenant,
}: {
  children: React.ReactNode;
  tenant: Tenant;
}) {
  return (
    <TenantContext.Provider value={tenant}>{children}</TenantContext.Provider>
  );
}

export function useTenant() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error("useTenant must be used within TenantProvider");
  }
  return context;
}
