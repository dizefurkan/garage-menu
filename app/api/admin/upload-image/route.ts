import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import sharp from "sharp";

export const runtime = "nodejs";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const BUCKET_NAME = "product-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(request: Request) {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "Dosya bulunamadı" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Sadece görsel dosyaları yüklenebilir" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Dosya boyutu 10MB'den küçük olmalıdır" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Read file buffer
    const buffer = await file.arrayBuffer();

    // Convert to WebP format (reduces file size by 50-70%)
    const webpBuffer = await sharp(Buffer.from(buffer))
      .rotate()
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    // Generate unique filename with .webp extension
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const baseFilename = file.name
      .replace(/\.[^/.]+$/, "") // Remove original extension
      .replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}-${random}-${baseFilename}.webp`;

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filename, webpBuffer, {
        contentType: "image/webp",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    if (!data) {
      throw new Error("Dosya yüklemesi başarısız");
    }

    // Get public URL
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${data.path}`;

    return NextResponse.json(
      { url: publicUrl, path: data.path },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Görsel yüklemesi başarısız";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
