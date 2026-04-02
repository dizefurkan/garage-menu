/**
 * Image Upload Handler - Server Action
 * Handles file uploads to Supabase Storage
 * @path app/api/admin/upload/route.ts
 */

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/auth/supabase";
import { getCurrentTenantId } from "@/lib/auth/server";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File is too large (max 5MB)" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(7);
    const extension = file.name.split(".").pop();
    const filename = `${timestamp}-${random}.${extension}`;

    // Upload to Supabase Storage
    // Path: product-images/{tenantId}/{filename}
    const { error: uploadError, data } = await supabase.storage
      .from("product-images")
      .upload(`${tenantId}/${filename}`, file, {
        contentType: file.type,
        cacheControl: "3600",
      });

    if (uploadError) {
      console.error("Storage error:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file" },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("product-images")
      .getPublicUrl(`${tenantId}/${filename}`);

    return NextResponse.json({
      url: publicUrl,
      path: `${tenantId}/${filename}`,
      size: file.size,
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE HANDLER (for removing old images)
// ============================================================================

export async function DELETE(request: NextRequest) {
  try {
    const tenantId = await getCurrentTenantId();
    if (!tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    // Security: Ensure path belongs to current tenant
    if (!path.startsWith(`${tenantId}/`)) {
      return NextResponse.json(
        { error: "Cannot delete file from another tenant" },
        { status: 403 }
      );
    }

    // Delete from storage
    const { error } = await supabase.storage
      .from("product-images")
      .remove([path]);

    if (error) {
      console.error("Storage delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete handler error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
