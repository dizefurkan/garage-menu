import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { user, tenant } = await getSessionWithTenant();

    if (!user || !tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const lang = req.nextUrl.searchParams.get("lang") || "en";

    const { data, error } = await (supabaseAdmin as any)
      .from("allergens")
      .select(
        `
        id,
        code,
        emoji,
        display_order,
        allergen_translations(name, language_code)
      `
      )
      .order("display_order");

    if (error) {
      console.error("Allergens fetch error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transformed = (data || []).map((allergen: any) => ({
      id: allergen.id,
      code: allergen.code,
      emoji: allergen.emoji,
      name:
        allergen.allergen_translations?.find(
          (t: any) => t.language_code === lang
        )?.name ||
        allergen.allergen_translations?.find(
          (t: any) => t.language_code === "en"
        )?.name ||
        allergen.code,
    }));

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Allergens fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
