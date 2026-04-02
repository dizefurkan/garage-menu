import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { validateAdminAuthorizationHeader } from "@/lib/basic-auth";

export const runtime = "nodejs";

const AUTH_HEADER = 'Basic realm="Admin Area"';
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: {
        ...NO_STORE_HEADERS,
        "WWW-Authenticate": AUTH_HEADER,
      },
    }
  );
}

export async function POST(request: Request) {
  const validationResult = validateAdminAuthorizationHeader(
    request.headers.get("authorization")
  );

  if (!validationResult.ok) {
    if (validationResult.reason === "misconfigured") {
      return NextResponse.json(
        { error: "Admin authentication is not configured" },
        { status: 500, headers: NO_STORE_HEADERS }
      );
    }

    return unauthorizedResponse();
  }

  try {
    revalidateTag("menu", "max");
    revalidateTag("images", "max");

    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to publish updates" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
