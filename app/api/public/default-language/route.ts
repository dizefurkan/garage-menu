import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return Response.json({ error: "Slug required" }, { status: 400 });
  }

  try {
    const { data: tenant, error } = await supabaseAdmin
      .from("tenants")
      .select("languages")
      .eq("slug", slug)
      .single();

    if (error || !tenant) {
      return Response.json({ error: "Tenant not found" }, { status: 404 });
    }

    const defaultLanguage =
      tenant.languages && tenant.languages.length > 0
        ? tenant.languages[0]
        : "en";

    return Response.json({ defaultLanguage });
  } catch (error) {
    console.error("[API] Error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
