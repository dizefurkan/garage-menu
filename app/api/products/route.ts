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

type ProductInsert = Database["public"]["Tables"]["products"]["Insert"];
type ProductTransInsert =
  Database["public"]["Tables"]["product_translations"]["Insert"];

export async function GET() {
  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("products")
      .select(
        `
        id,
        category_id,
        price,
        image_url,
        product_translations(language_code, name, description)
      `
      )
      .order("id");

    if (error) throw error;

    return NextResponse.json({ products: data }, { status: 200 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch products";
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
      category_id?: number;
      price?: number;
      image_url?: string | null;
      translations?: Record<string, { name: string; description: string }>;
    } | null;

    if (!body || !body.category_id || !body.translations) {
      return NextResponse.json(
        { error: "Missing required fields: category_id, translations" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Insert product
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: productData, error: productError } = (await supabaseAdmin
      .from("products")
      .insert([
        {
          category_id: body.category_id,
          price: body.price || 0,
          image_url: body.image_url || null,
        } as never,
      ] as never)
      .select()) as { data: any; error: any };

    if (productError) throw productError;

    const productId = productData?.[0]?.id;
    if (!productId) {
      throw new Error("Failed to create product");
    }

    // Insert translations
    const translations = Object.entries(body.translations).map(
      ([lang, trans]) =>
        ({
          product_id: productId,
          language_code: lang,
          name: trans.name,
          description: trans.description,
        }) as ProductTransInsert
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: transError } = await supabaseAdmin
      .from("product_translations")
      .insert(translations as never);

    if (transError) throw transError;

    return NextResponse.json(
      { success: true, productId },
      { status: 201, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create product";
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
      category_id?: number;
      price?: number;
      image_url?: string | null;
      translations?: Record<string, { name: string; description: string }>;
    } | null;

    if (!body?.id) {
      return NextResponse.json(
        { error: "Missing product id" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Update product
    const updatePayload: Partial<ProductInsert> = {};
    if (body.category_id !== undefined)
      updatePayload.category_id = body.category_id;
    if (body.price !== undefined) updatePayload.price = body.price;
    if (body.image_url !== undefined) updatePayload.image_url = body.image_url;

    if (Object.keys(updatePayload).length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await supabaseAdmin
        .from("products")
        .update(updatePayload as never)
        .eq("id", body.id);

      if (updateError) throw updateError;
    }

    // Update translations if provided
    if (body.translations && Object.keys(body.translations).length > 0) {
      for (const [lang, trans] of Object.entries(body.translations)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: upsertError } = await supabaseAdmin
          .from("product_translations")
          .upsert(
            {
              product_id: body.id,
              language_code: lang,
              name: trans.name,
              description: trans.description,
            } as never,
            { onConflict: "product_id,language_code" }
          );

        if (upsertError) throw upsertError;
      }
    }

    return NextResponse.json(
      { success: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update product";
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
        { error: "Missing product id" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    // Delete translations first (cascade would do this automatically)
    await supabaseAdmin
      .from("product_translations")
      .delete()
      .eq("product_id", body.id);

    // Delete product
    const { error } = await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", body.id);

    if (error) throw error;

    return NextResponse.json(
      { success: true },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete product";
    return NextResponse.json(
      { error: message },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
