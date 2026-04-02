import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
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

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const filename = `${timestamp}-${randomId}.webp`;

    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabaseAdmin.storage
      .from("product-images")
      .upload(filename, buffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    const publicUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${filename}`;

    return NextResponse.json(
      { filename, publicUrl },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to upload image";

    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
