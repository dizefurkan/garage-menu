/**
 * 3D Model Delete Handler
 * Removes a GLB/USDZ object from the product-models bucket.
 * Accepts either a storage path or the full public URL.
 * @path app/api/admin/delete-model/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getCurrentTenantId } from "@/lib/auth/server";

const BUCKET_NAME = "product-models";

export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    let path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    // Allow passing the full public URL; reduce it to the object path
    const publicPrefix = `/storage/v1/object/public/${BUCKET_NAME}/`;
    const prefixIndex = path.indexOf(publicPrefix);
    if (prefixIndex !== -1) {
      path = decodeURIComponent(path.slice(prefixIndex + publicPrefix.length));
    }

    // Security: ensure path belongs to current tenant
    if (!path.startsWith(`${tenantId}/`)) {
      return NextResponse.json(
        { error: "Cannot delete file from another tenant" },
        { status: 403 }
      );
    }

    const { error } = await (supabaseAdmin as any).storage
      .from(BUCKET_NAME)
      .remove([path]);

    if (error) {
      console.error("Model delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete model handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
