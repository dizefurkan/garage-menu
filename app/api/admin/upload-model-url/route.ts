/**
 * 3D Model Upload URL Handler
 * Issues a signed upload URL so the browser can upload GLB/USDZ files
 * (up to 25MB) directly to Supabase Storage, bypassing the Vercel
 * serverless request body limit (~4.5MB).
 * @path app/api/admin/upload-model-url/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/auth/server";

const BUCKET_NAME = "product-models";
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB (also enforced by the bucket)
const ALLOWED_KINDS = ["glb", "usdz"] as const;

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

    const { kind, size } = await request.json();

    if (!ALLOWED_KINDS.includes(kind)) {
      return NextResponse.json(
        { error: "Invalid file kind (glb or usdz)" },
        { status: 400 }
      );
    }

    if (typeof size !== "number" || size <= 0 || size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large (max 25MB)" },
        { status: 413 }
      );
    }

    // Server-generated path - never accept a client-supplied path
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const path = `${tenantId}/${timestamp}-${random}.${kind}`;

    const { data, error } = await (supabaseAdmin as any).storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    if (error || !data) {
      console.error("Signed upload URL error:", error);
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
    console.error("Upload URL handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
