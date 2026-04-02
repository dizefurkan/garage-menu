import { NextResponse, type NextRequest } from "next/server";

const AUTH_REALM = 'Basic realm="Admin Area"';

function unauthorizedResponse() {
  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": AUTH_REALM,
      "Cache-Control": "no-store",
    },
  });
}

export function middleware(request: NextRequest) {
  const expectedUsername = process.env.ADMIN_USER?.trim();
  const expectedPassword = process.env.ADMIN_PASS?.trim();

  if (!expectedUsername || !expectedPassword) {
    return NextResponse.json(
      { error: "Admin authentication is not configured" },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }

  const authorizationHeader = request.headers.get("authorization");

  if (!authorizationHeader) {
    return unauthorizedResponse();
  }

  const [scheme, encodedValue] = authorizationHeader.split(" ");

  if (scheme !== "Basic" || !encodedValue) {
    return unauthorizedResponse();
  }

  let decodedValue = "";

  try {
    decodedValue = atob(encodedValue);
  } catch {
    return unauthorizedResponse();
  }

  const separatorIndex = decodedValue.indexOf(":");

  if (separatorIndex === -1) {
    return unauthorizedResponse();
  }

  const username = decodedValue.slice(0, separatorIndex);
  const password = decodedValue.slice(separatorIndex + 1);

  if (username !== expectedUsername || password !== expectedPassword) {
    return unauthorizedResponse();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/publish/:path*"],
};
