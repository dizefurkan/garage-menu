import { NextRequest, NextResponse } from "next/server";

/**
 * Custom middleware for multi-language routing
 * Handles redirects for legacy /app routes to new structure
 */
const ADMIN_LANG_COOKIE = "admin_lang";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip API and static routes
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) {
    return NextResponse.next();
  }
  
  // Public menu routes without a language (/menu/[slug]) are resolved by the
  // page itself: it picks the visitor's device language when the menu offers
  // it and the venue's default language otherwise. Unavailable languages
  // (/menu/[slug]/de) are redirected to the default by the menu page too.

  // Admin routes: remember the dashboard language in a cookie whenever a
  // localized admin URL is visited, and use it to localize dilsiz paths
  // (/admin/products -> /admin/<lang>/products) instead of always falling
  // back to "en".
  if (pathname.startsWith("/admin/") && !pathname.startsWith("/admin/api")) {
    const segments = pathname.split("/").filter(Boolean);
    const KNOWN_LOCALES = ["en", "tr"];

    if (segments.length > 1 && !KNOWN_LOCALES.includes(segments[1])) {
      const saved = request.cookies.get(ADMIN_LANG_COOKIE)?.value;
      const lang = saved && KNOWN_LOCALES.includes(saved) ? saved : "en";
      const adminPath = segments.slice(1).join("/");
      return NextResponse.redirect(
        new URL(`/admin/${lang}/${adminPath}${request.nextUrl.search}`, request.url)
      );
    }

    if (segments.length > 1 && request.cookies.get(ADMIN_LANG_COOKIE)?.value !== segments[1]) {
      const response = NextResponse.next();
      response.cookies.set(ADMIN_LANG_COOKIE, segments[1], {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });
      return response;
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
