"use client";

import { usePathname } from "next/navigation";
import { logout } from "@/lib/auth/logout";
import { TenantProvider } from "@/lib/context/tenant-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import Link from "next/link";
import type { Database } from "@/lib/database.types";
import { LayoutDashboard, Package, Tag, Settings } from "lucide-react";

const NAV_ITEMS_CONFIG = [
  { key: "dashboard", path: "dashboard", icon: LayoutDashboard },
  { key: "products", path: "products", icon: Package },
  { key: "categories", path: "categories", icon: Tag },
  { key: "settings", path: "settings", icon: Settings },
];

interface AdminLayoutClientProps {
  children: React.ReactNode;
  user: { email: string };
  tenant: Database["public"]["Tables"]["tenants"]["Row"];
  role: string;
  lang: string;
  messages: Record<string, any>;
}

export function AdminLayoutClient({
  children,
  user,
  tenant,
  role,
  lang,
  messages,
}: AdminLayoutClientProps) {
  const pathname = usePathname();

  // Get navigation translations
  const navigationMessages = messages.navigation || {};
  const getTranslation = (key: string) => navigationMessages[key] || key;

  const NAV_ITEMS = NAV_ITEMS_CONFIG.map((item) => ({
    label: getTranslation(item.key),
    href: `/admin/${lang}/${item.path}`,
    path: item.path,
    icon: item.icon,
  }));

  const isActive = (path: string) => {
    return (
      pathname.includes(`/${path}`) || pathname === `/admin/${lang}/${path}`
    );
  };

  return (
    <>
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
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      closeOnClick
                      isActive={isActive(item.path)}
                      tooltip={item.label}
                    >
                      <Link
                        href={item.href}
                        className="flex items-center gap-2"
                      >
                        <Icon className="size-4" />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
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
  );
}
