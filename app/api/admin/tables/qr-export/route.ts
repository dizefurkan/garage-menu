import { getSessionWithTenant } from "@/lib/auth/session";
import { supabaseAdmin } from "@/lib/supabase";
import { guardAddonAccess } from "@/lib/licensing/hasAddon";
import { NextRequest, NextResponse } from "next/server";

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

    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get("format") || "json"; // json or html
    const tableIds = searchParams.getAll("tableIds");

    // Fetch tables
    let query = (supabaseAdmin as any)
      .from("tables")
      .select("*")
      .eq("tenant_id", tenant.id)
      .order("display_order", { ascending: true });

    if (tableIds.length > 0) {
      query = query.in("id", tableIds);
    }

    const { data: tables, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch tables: ${error.message}`);
    }

    if (!tables || tables.length === 0) {
      return NextResponse.json({ error: "No tables found" }, { status: 404 });
    }

    // Generate QR data (URLs) for each table
    // Format: /menu/{tenant_slug}/tr?tableId={table_id}
    const qrData = tables.map((table: any) => ({
      id: table.id,
      label: table.label,
      url: `${request.nextUrl.origin}/menu/${tenant.slug}/tr?tableId=${table.id}`,
    }));

    if (format === "html") {
      // Return HTML page with QR codes for printing
      const html = generateQRHtml(qrData, tenant.name);
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html" },
      });
    }

    // Default: return JSON with QR URLs
    return NextResponse.json({
      tenant_name: tenant.name,
      table_count: qrData.length,
      qr_data: qrData,
    });
  } catch (error) {
    console.error("Error exporting QR codes:", error);
    return NextResponse.json(
      { error: "Failed to export QR codes" },
      { status: 500 }
    );
  }
}

function generateQRHtml(
  qrData: Array<{ id: string; label: string; url: string }>,
  tenantName: string
): string {
  const qrCodes = qrData
    .map(
      (item) => `
    <div class="qr-card">
      <h3>${item.label}</h3>
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(item.url)}" alt="QR Code for ${item.label}" />
      <p class="url">${item.url}</p>
    </div>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR Codes - ${tenantName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { text-align: center; margin-bottom: 30px; color: #333; }
    .qr-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; }
    .qr-card {
      background: white;
      border: 2px solid #ddd;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      page-break-inside: avoid;
    }
    .qr-card h3 { margin-bottom: 15px; font-size: 18px; color: #333; }
    .qr-card img { max-width: 100%; height: auto; margin-bottom: 15px; }
    .url { font-size: 12px; color: #666; word-break: break-all; }
    @media print {
      body { padding: 0; background: white; }
      .qr-card { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>QR Codes for ${tenantName}</h1>
    <div class="qr-grid">
      ${qrCodes}
    </div>
  </div>
  <script>
    window.addEventListener('load', () => {
      // Auto-focus print dialog after page loads
      // Uncomment if desired:
      // window.print();
    });
  </script>
</body>
</html>
  `;
}
