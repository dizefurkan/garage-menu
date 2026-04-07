import { NextRequest, NextResponse } from "next/server";

/**
 * Custom middleware for multi-language routing
 * Handles redirects for legacy /app routes to new structure
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip API and static routes
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }
  
  // Handle public menu routes without language parameter -> redirect to /menu/[slug]/[lang]
  // /menu/garage-chocolate-croissant -> /menu/garage-chocolate-croissant/en
  if (pathname.startsWith("/menu/")) {
    const segments = pathname.split("/").filter(Boolean);
    const KNOWN_LOCALES = ["en", "tr"];
    
    // If there are only 2 segments (menu + slug) or last segment is not a known locale, redirect to default (en)
    if (segments.length === 2 || (segments.length > 2 && !KNOWN_LOCALES.includes(segments[segments.length - 1]))) {
      const slug = segments[1];
      return NextResponse.redirect(new URL(`/menu/${slug}/en`, request.url));
    }
  }

  // Handle admin routes without language parameter -> redirect to /admin/[lang]
  // /admin/dashboard -> /admin/en/dashboard
  // /admin/products -> /admin/en/products
  if (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/api")) {
    const segments = pathname.split("/").filter(Boolean);
    const KNOWN_LOCALES = ["en", "tr"];
    
    // If second segment (after "admin") is not a known locale, redirect to default (en)
    if (segments.length > 1 && !KNOWN_LOCALES.includes(segments[1])) {
      const adminPath = segments.slice(1).join("/");
      return NextResponse.redirect(new URL(`/admin/en/${adminPath}`, request.url));
    }
  }

  // Handle legacy /app routes and redirect to new structure
  // /app/en -> /en
  // /app/tr -> /tr
  // /app/en/admin/... -> /admin/en/...
  // /app/tr/admin/... -> /admin/tr/...
  if (pathname.startsWith("/app/")) {
    const segments = pathname.split("/").filter(Boolean);
    const KNOWN_LOCALES = ["en", "tr"];
    
    if (segments.length > 1 && KNOWN_LOCALES.includes(segments[1])) {
      const locale = segments[1];
      
      if (segments.length > 2 && segments[2] === "admin") {
        // /app/en/admin/dashboard -> /admin/en/dashboard
        const adminPath = segments.slice(3).join("/");
        const redirectPath = adminPath ? `/admin/${locale}/${adminPath}` : `/admin/${locale}`;
        return NextResponse.redirect(new URL(redirectPath, request.url));
      } else if (segments.length === 2) {
        // /app/en -> /en
        return NextResponse.redirect(new URL(`/${locale}`, request.url));
      }
    }
    
    return NextResponse.next();
  }
  
  // Allow all other routes to pass through
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match all routes except static files
    "/((?!_next/static|_next/image|favicon|public).*)",
  ],
};
