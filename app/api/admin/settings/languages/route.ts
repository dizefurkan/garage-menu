import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const { user, tenant, role } = await getSessionWithTenant();

    if (!user || !tenant || role !== "owner") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { tenant_id, languages } = await req.json();

    if (tenant_id !== tenant.id) {
      return NextResponse.json({ error: "Tenant mismatch" }, { status: 403 });
    }

    if (!Array.isArray(languages) || languages.length === 0) {
      return NextResponse.json(
        { error: "At least one language is required" },
        { status: 400 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    const { error } = await (supabaseAdmin as any)
      .from("tenants")
      .update({ languages })
      .eq("id", tenant_id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Settings update error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
