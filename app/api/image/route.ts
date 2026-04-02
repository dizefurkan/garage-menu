import { NextResponse } from "next/server";
import sharp from "sharp";
import {
  buildGoogleDriveViewUrl,
  extractGoogleDriveFileId,
} from "@/lib/google-drive";

export const runtime = "nodejs";

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
const NO_STORE_HEADERS = {
  "Cache-Control": "no-store",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawId = searchParams.get("id")?.trim();

  if (!rawId) {
    return NextResponse.json(
      { error: "Missing required query parameter: id" },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const fileId = extractGoogleDriveFileId(rawId) ?? rawId;

  try {
    const upstreamResponse = await fetch(buildGoogleDriveViewUrl(fileId), {
      cache: "force-cache",
      next: {
        revalidate: ONE_YEAR_IN_SECONDS,
        tags: ["images"],
      },
      headers: {
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
      },
    });

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from Google Drive" },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    const inputBuffer = Buffer.from(await upstreamResponse.arrayBuffer());
    const outputBuffer = await sharp(inputBuffer)
      .rotate()
      .webp({ quality: 82, effort: 4 })
      .toBuffer();

    return new Response(new Uint8Array(outputBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        "Cache-Control": `public, max-age=${ONE_YEAR_IN_SECONDS}, s-maxage=${ONE_YEAR_IN_SECONDS}, immutable`,
        "CDN-Cache-Control": `public, s-maxage=${ONE_YEAR_IN_SECONDS}, immutable`,
        "Vercel-CDN-Cache-Control": `public, s-maxage=${ONE_YEAR_IN_SECONDS}, immutable`,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 502, headers: NO_STORE_HEADERS }
    );
  }
}
