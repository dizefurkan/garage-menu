import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware for Next.js 16+
 * Using "proxy" instead of deprecated middleware
 * Authentication is handled at component level via getSessionWithTenant()
 */

export function middleware(request: NextRequest) {
  // All authentication is now handled by getSessionWithTenant() in server components
  // and getSession() in API routes
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
