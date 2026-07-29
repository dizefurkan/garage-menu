"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { NextIntlClientProvider } from "next-intl";
import { toast } from "sonner";
import { logout } from "@/lib/auth/logout";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser-client";
import { TenantProvider, useTenant } from "@/lib/context/tenant-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import type { Database } from "@/lib/database.types";
import { BarChart3, LayoutDashboard, Package, Tag, Settings, ShoppingCart, ChevronDown } from "lucide-react";

const NAV_ITEMS_CONFIG = [
  { key: "dashboard", path: "dashboard", icon: LayoutDashboard },
  { key: "analytics", path: "analytics", icon: BarChart3 },
  { key: "products", path: "products", icon: Package },
  { key: "categories", path: "categories", icon: Tag },
  { key: "orders", path: "orders", icon: ShoppingCart, children: [
    { key: "orders_list", path: "orders" },
    { key: "tables", path: "tables" },
    { key: "statuses", path: "orders/statuses" },
    { key: "order_settings", path: "orders/settings" },
  ], addon: "orders_management" },
  { key: "settings", path: "settings", icon: Settings },
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: { email: string };
  tenant: Database["public"]["Tables"]["tenants"]["Row"];
  role: string;
  lang: string;
  messages: Record<string, any>;
  enabledAddons?: string[];
}

function SidebarNavigation({ lang, pathname, enabledAddons = [] }: {
  lang: string;
  pathname: string;
  enabledAddons?: string[];
}) {
  const t = useTranslations("navigation");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const isActive = (path: string) => {
    return (
      pathname.includes(`/${path}`) || pathname === `/admin/${lang}/${path}`
    );
  };

  // Submenu items are leaf routes (e.g. "orders", "orders/statuses",
  // "orders/settings") that share a URL prefix with each other, so the
  // prefix-based `isActive` above would highlight "Siparişler" while on
  // "/orders/statuses" too — an exact match is what we actually want here.
  const isChildActive = (path: string) => pathname === `/admin/${lang}/${path}`;

  const isGroupActive = (children?: any[]) => {
    return children && children.length > 0 && children.some((child) => isChildActive(child.path));
  };

  const toggleOpen = (itemPath: string) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemPath)) {
        next.delete(itemPath);
      } else {
        next.add(itemPath);
      }
      return next;
    });
  };

  return (
    <SidebarMenu>
      {NAV_ITEMS_CONFIG.map((item: any) => {
        // Skip if addon-gated and not enabled
        if (item.addon && !enabledAddons.includes(item.addon)) {
          return null;
        }

        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isOpen = openItems.has(item.path) || isGroupActive(item.children);

        if (hasChildren) {
          return (
            <Collapsible
              key={item.path}
              asChild
              open={isOpen}
              onOpenChange={() => toggleOpen(item.path)}
              className="group/collapsible"
            >
              {/* Local SidebarMenuItem is themed `flex items-center` (registry
                  is just `relative`), which would lay the trigger and the
                  submenu out side by side — stack them instead, and re-center
                  the fixed-width button in icon mode. */}
              <SidebarMenuItem className="flex-col items-stretch group-data-[collapsible=icon]:items-center">
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={t(item.key)}>
                    <Icon />
                    {/* SidebarMenuButton only auto-hides `span:last-child` in
                        icon mode; the chevron makes the label a middle child,
                        so both need the explicit collapse rule or the label
                        overflows into the 40px icon slot and hides the icon. */}
                    <span className="group-data-[collapsible=icon]:hidden">
                      {t(item.key)}
                    </span>
                    <ChevronDown className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180 group-data-[collapsible=icon]:hidden" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.children.map((child: any) => (
                      <SidebarMenuSubItem key={child.path}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={isChildActive(child.path)}
                        >
                          <Link href={`/admin/${lang}/${child.path}`}>
                            {t(child.key)}
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        }

        return (
          <SidebarMenuItem key={item.path}>
            <SidebarMenuButton
              asChild
              isActive={isActive(item.path)}
              tooltip={t(item.key)}
            >
              <Link href={`/admin/${lang}/${item.path}`}>
                <Icon />
                <span>{t(item.key)}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function OrderNotificationsListener({
  tenantId,
  lang,
}: {
  tenantId: number;
  lang: string;
}) {
  const t = useTranslations("admin");
  const audioRef = useRef<HTMLAudioElement>(null);
  const [supabase] = useState(() => createBrowserSupabaseClient());

  useEffect(() => {
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    (async () => {
      // Ensure the session is loaded before subscribing — otherwise the
      // Realtime socket connects without a JWT and RLS silently drops
      // every event (see orders/page.tsx for the same pattern).
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        (supabase as any).realtime.setAuth(session.access_token);
      }

      channel = supabase
        .channel(`orders-notifications:${tenantId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "orders",
            filter: `tenant_id=eq.${tenantId}`,
          },
          async (payload: any) => {
            const stopSound = () => {
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
              }
            };

            // Keeps looping until the admin dismisses or acts on the
            // toast — a one-shot chime is too easy to miss.
            if (audioRef.current) {
              audioRef.current.loop = true;
              audioRef.current.play().catch(() => {});
            }

            // Realtime payloads only carry raw `orders` columns (the
            // table_id FK, not a joined label) — look the label up.
            const { data: tableRow } = await supabase
              .from("tables")
              .select("label")
              .eq("id", payload.new.table_id)
              .single();
            const tableLabel = (tableRow as any)?.label || payload.new.table_id;

            toast.success(
              t("newOrderNotificationTitle", { table: tableLabel }),
              {
                description: t("newOrderNotificationBody", {
                  total: payload.new.total_amount,
                }),
                duration: Infinity,
                onDismiss: stopSound,
                onAutoClose: stopSound,
                action: {
                  label: t("viewOrders"),
                  onClick: () => {
                    stopSound();
                    window.location.href = `/admin/${lang}/orders`;
                  },
                },
              }
            );
          }
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, [tenantId, lang, supabase, t]);

  return <audio ref={audioRef} src="/sounds/Ordersup.mp3" />;
}

export function AdminLayoutClient({
  children,
  user,
  tenant,
  role,
  lang,
  messages,
  enabledAddons = [],
}: AdminLayoutClientProps) {
  const pathname = usePathname();

  return (
    <NextIntlClientProvider
      locale={lang}
      messages={messages}
      timeZone="Europe/Istanbul"
    >
      <>
        {enabledAddons.includes("orders_management") && (
          <OrderNotificationsListener tenantId={tenant.id} lang={lang} />
        )}
        <style>{`
          [data-sidebar][data-state="expanded"] [data-sidebar="header"] > div {
            visibility: visible;
            pointer-events: auto;
          }
        `}</style>
        <SidebarProvider defaultOpen={true}>
        <Sidebar collapsible="icon">
          {!pathname.includes("/team") && (
            <SidebarHeader className="border-b h-14">
              <div className="px-2 flex items-center h-full">
                <h1 className="font-semibold text-xs sm:text-sm md:text-base truncate text-sidebar-foreground">
                  {tenant.name}
                </h1>
              </div>
            </SidebarHeader>
          )}
          <SidebarContent>
            <SidebarNavigation
              lang={lang}
              pathname={pathname}
              enabledAddons={enabledAddons}
            />
          </SidebarContent>
          <SidebarFooter className="border-t">
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <SidebarMenuButton
                    asChild
                    className="h-auto group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
                  >
                    <DropdownMenuTrigger className="cursor-pointer w-full flex items-center group-data-[collapsible=icon]:justify-center">
                      {/* Desktop - Show email/role */}
                      <div className="flex-1 text-left min-w-0 group-data-[collapsible=icon]:hidden">
                        <div className="text-xs font-medium truncate">
                          {user.email}
                        </div>
                        <div className="text-xs text-sidebar-foreground/50 truncate capitalize">
                          {role === "owner"
                            ? "Owner"
                            : role === "editor"
                              ? "Editor"
                              : "Viewer"}
                        </div>
                      </div>
                      {/* Collapsed - Show icon */}
                      <svg
                        className="hidden group-data-[collapsible=icon]:block size-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </DropdownMenuTrigger>
                  </SidebarMenuButton>
                  <DropdownMenuContent
                    align="end"
                    side="right"
                    className="w-56 z-50"
                  >
                    <DropdownMenuItem disabled>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {user.email}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {tenant.name}
                        </span>
                      </div>
                    </DropdownMenuItem>
                    <form action={logout} className="w-full">
                      <button
                        type="submit"
                        className="relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground mt-2"
                      >
                        Sign Out
                      </button>
                    </form>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset style={{} as React.CSSProperties}>
          {/* Header */}
          <header className="border-b flex-none sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full h-14">
            <div className="flex items-center justify-between px-6 h-full gap-4">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="-ml-1" />
                <a
                  href={`/menu/${tenant.slug}/${lang}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium hover:underline"
                >
                  👁️ Menu
                </a>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <div className="flex-1 overflow-auto p-8">
            <TenantProvider tenant={tenant}>{children}</TenantProvider>
          </div>
        </SidebarInset>
      </SidebarProvider>
      </>
    </NextIntlClientProvider>
  );
}
