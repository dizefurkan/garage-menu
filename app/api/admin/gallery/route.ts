import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { NextResponse, NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const { user, tenant } = await getSessionWithTenant();

    if (!user || !tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get pagination parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = 20; // 20 images per page
    const offset = (page - 1) * pageSize;

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Query products table for all images for this tenant
    const { data: products, error } = await (supabaseAdmin as any)
      .from("products")
      .select("image_url")
      .eq("tenant_id", tenant.id)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Products query error:", error);
      return NextResponse.json(
        { error: "Failed to fetch gallery" },
        { status: 500 }
      );
    }

    // Extract unique image URLs (some products might use the same image)
    const uniqueImages = Array.from(
      new Map(
        ((products as any[]) || [])
          .filter((p: any) => p.image_url)
          .map((p: any) => [p.image_url, p.image_url])
      ).values()
    );

    // Apply pagination
    const totalImages = uniqueImages.length;
    const totalPages = Math.ceil(totalImages / pageSize);
    const paginatedImages = uniqueImages.slice(offset, offset + pageSize);

    return NextResponse.json(
      {
        images: paginatedImages,
        pagination: {
          page,
          pageSize,
          total: totalImages,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Gallery error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
