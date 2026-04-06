import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { ThemeConfigSchema } from "@/lib/utils/validation";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const { user, tenant, role } = await getSessionWithTenant();

    if (!user || !tenant || role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { tenant_id, theme_config } = await req.json();

    if (tenant_id !== tenant.id) {
      return NextResponse.json({ error: "Tenant mismatch" }, { status: 403 });
    }

    // Validate theme config
    const validatedConfig = ThemeConfigSchema.parse(theme_config);

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const { error: updateError } = await (supabaseAdmin as any)
      .from("tenants")
      .update({
        theme_config: validatedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenant.id);

    if (updateError) {
      console.error("[updateTheme] Error:", updateError);
      return NextResponse.json(
        { error: "Failed to update theme" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Theme updated successfully",
    });
  } catch (error) {
    console.error("[updateTheme] Exception:", error);

    if (error instanceof Error && error.message.includes("Invalid")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
