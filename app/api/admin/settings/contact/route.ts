import { getSessionWithTenant } from "@/lib/auth/session";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function PATCH(request: Request) {
  try {
    const { user, tenant, role } = await getSessionWithTenant();

    console.log("[Contact Settings API] User:", user?.id, "Role:", role);

    if (!user || !tenant || role !== "owner") {
      console.error("[Contact Settings API] Unauthorized:", {
        user: !!user,
        tenant: !!tenant,
        role,
      });
      return new Response(
        JSON.stringify({ error: "Unauthorized - must be owner" }),
        { status: 403 }
      );
    }

    const body = await request.json();
    console.log("[Contact Settings API] Body:", body);

    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Error handling
            }
          },
        },
      }
    );

    const updateData = {
      contact_info: {
        address: body.address || "",
        facebook: body.facebook || "",
        instagram: body.instagram || "",
        tiktok: body.tiktok || "",
        email: body.email || "",
        whatsapp: body.whatsapp || "",
      },
    };

    console.log(
      "[Contact Settings API] Updating tenant:",
      tenant.id,
      "Data:",
      updateData
    );

    const { error } = await supabase
      .from("tenants")
      .update(updateData)
      .eq("id", tenant.id);

    if (error) {
      console.error("[Contact Settings API] Supabase Error:", error);
      return new Response(
        JSON.stringify({
          error: error.message || "Failed to update contact info",
        }),
        { status: 500 }
      );
    }

    console.log("[Contact Settings API] Success");
    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (error) {
    console.error("[Contact Settings API] Exception:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500 }
    );
  }
}
