import { NextResponse } from "next/server";
import { getMenuFromDatabase } from "@/lib/menu-db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const menu = await getMenuFromDatabase();

    return NextResponse.json(menu, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch menu";

    return NextResponse.json(
      { error: message },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
