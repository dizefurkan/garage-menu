/**
 * Product Image Upload URL Handler
 * Issues a signed upload URL so the browser can upload the (client-side
 * resized/encoded) product image directly to Supabase Storage instead of
 * proxying the bytes through a Vercel serverless function.
 * @path app/api/admin/upload-image-url/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/auth/server";

const BUCKET_NAME = "product-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB; client sends ~100KB after resize
const ALLOWED_FORMATS = ["webp", "jpeg"] as const;

export async function POST(request: NextRequest) {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const { format, size } = await request.json();

    if (!ALLOWED_FORMATS.includes(format)) {
      return NextResponse.json(
        { error: "Invalid image format" },
        { status: 400 }
      );
    }

    if (typeof size !== "number" || size <= 0 || size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large (max 10MB)" },
        { status: 413 }
      );
    }

    // Server-generated path - never accept a client-supplied path
    const extension = format === "jpeg" ? "jpg" : "webp";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const path = `${tenantId}/${timestamp}-${random}.${extension}`;

    const { data, error } = await (supabaseAdmin as any).storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("Signed image upload URL error:", error);
      return NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = (supabaseAdmin as any).storage.from(BUCKET_NAME).getPublicUrl(path);

    return NextResponse.json({
      path: data.path,
      token: data.token,
      publicUrl,
    });
  } catch (error) {
    console.error("Image upload URL handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
