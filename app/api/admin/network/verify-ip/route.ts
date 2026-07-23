import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { guardAddonAccess } from "@/lib/licensing/hasAddon";
import { NextRequest, NextResponse } from "next/server";

/**
 * Detects the user's public IP and saves it as the restaurant's network IP.
 * Called from admin when they want to register their WiFi network for auto-approval.
 */
export async function POST(request: NextRequest) {
  try {
    const { user, tenant } = await getSessionWithTenant();

    if (!user || !tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check addon access
    const hasAccess = await guardAddonAccess(tenant, "orders_management", supabaseAdmin);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Orders & Tables addon not enabled" },
        { status: 403 }
      );
    }

    // Get client's public IP from headers
    // Try common headers that proxy/load balancer might set
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    if (clientIp === "unknown" || !clientIp) {
      return NextResponse.json(
        { error: "Could not detect IP address. Please try again." },
        { status: 400 }
      );
    }

    // Validate IP format (basic check)
    const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$|^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
    if (!ipPattern.test(clientIp)) {
      return NextResponse.json(
        { error: "Invalid IP address format" },
        { status: 400 }
      );
    }

    // Save to tenant
    const { data, error } = await (supabaseAdmin as any)
      .from("tenants")
      .update({
        verified_network_ip: clientIp,
        updated_at: new Date().toISOString(),
      })
      .eq("id", tenant.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Network IP registered: ${clientIp}`,
      verified_network_ip: data.verified_network_ip,
    });
  } catch (error) {
    console.error("Error verifying network IP:", error);
    return NextResponse.json(
      { error: "Failed to verify network IP" },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check current registered network IP and validate requester's IP
 */
export async function GET(request: NextRequest) {
  try {
    const { user, tenant } = await getSessionWithTenant();

    if (!user || !tenant) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check addon access
    const hasAccess = await guardAddonAccess(tenant, "orders_management", supabaseAdmin);
    if (!hasAccess) {
      return NextResponse.json(
        { error: "Orders & Tables addon not enabled" },
        { status: 403 }
      );
    }

    // Get client's current IP
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      request.headers.get("cf-connecting-ip") ||
      "unknown";

    // Fetch tenant's registered IP
    const { data, error } = await (supabaseAdmin as any)
      .from("tenants")
      .select("verified_network_ip, order_pin_code, order_pin_date")
      .eq("id", tenant.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const registered_ip = data.verified_network_ip;
    const current_ip = clientIp;
    const ip_matches = registered_ip === current_ip;

    return NextResponse.json({
      tenant_name: tenant.name,
      registered_network_ip: registered_ip,
      current_ip,
      ip_matches,
      has_pin_set: !!data.order_pin_code,
      pin_code: data.order_pin_code,
      pin_date: data.order_pin_date,
    });
  } catch (error) {
    console.error("Error checking network IP:", error);
    return NextResponse.json(
      { error: "Failed to check network IP" },
      { status: 500 }
    );
  }
}
