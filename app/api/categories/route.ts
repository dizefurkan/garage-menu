import { NextResponse } from "next/server";
import { supabaseAdmin, type Database } from "@/lib/supabase";
import { validateAdminAuthorizationHeader } from "@/lib/basic-auth";

export const runtime = "nodejs";

const AUTH_HEADER = 'Basic realm="Admin Area"';
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function unauthorizedResponse() {
  return NextResponse.json(
    { error: "Unauthorized" },
    {
      status: 401,
      headers: { ...NO_STORE_HEADERS, "WWW-Authenticate": AUTH_HEADER },
    }
  );
}

type CategoryTransInsert =
  Database["public"]["Tables"]["category_translations"]["Insert"];

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("categories")
      .select(
        `
        id,
        category_translations(language_code, name)
      `
      )
      .order("id");

    if (error) throw error;

    return NextResponse.json({ categories: data }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch categories";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
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
    const body = (await request.json().catch(() => null)) as {
      translations?: Record<string, string>;
    } | null;

    if (
      !body ||
      !body.translations ||
      Object.keys(body.translations).length === 0
    ) {
      return NextResponse.json(
        { error: "Missing translations" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Insert category (no required fields, will be auto-generated)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: catData, error: catError } = (await supabaseAdmin
      .from("categories")
      .insert([{}] as any)
      .select()) as { data: any; error: any };

    if (catError) throw catError;

    const categoryId = catData?.[0]?.id;
    if (!categoryId) {
      throw new Error("Failed to create category");
    }

    // Insert translations
    const translations = Object.entries(body.translations).map(
      ([lang, name]) =>
        ({
          category_id: categoryId,
          language_code: lang,
          name,
        }) as CategoryTransInsert
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: transError } = await supabaseAdmin
      .from("category_translations")
      .insert(translations as never);

    if (transError) throw transError;

    return NextResponse.json(
      { success: true, categoryId },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create category";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function PUT(request: Request) {
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
    const body = (await request.json().catch(() => null)) as {
      id?: number;
      translations?: Record<string, string>;
    } | null;

    if (!body?.id || !body.translations) {
      return NextResponse.json(
        { error: "Missing id or translations" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Update translations
    for (const [lang, name] of Object.entries(body.translations)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: upsertError } = await supabaseAdmin
        .from("category_translations")
        .upsert(
          {
            category_id: body.id,
            language_code: lang,
            name,
          } as never,
          { onConflict: "category_id,language_code" }
        );

      if (upsertError) throw upsertError;
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update category";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function DELETE(request: Request) {
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
    const body = (await request.json().catch(() => null)) as {
      id?: number;
    } | null;

    if (!body?.id) {
      return NextResponse.json(
        { error: "Missing category id" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Delete translations first
    await supabaseAdmin
      .from("category_translations")
      .delete()
      .eq("category_id", body.id);

    // Delete category
    const { error } = await supabaseAdmin
      .from("categories")
      .delete()
      .eq("id", body.id);

    if (error) throw error;

    return NextResponse.json(
      { success: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete category";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
