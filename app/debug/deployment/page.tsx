import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function DeploymentDebugPage() {
  let dbCheck = { status: "unknown", error: null as any };
  let params = { configured: false, count: 0, error: null as any };

  // Try to check Supabase connection
  try {
    if (
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );

      const { data, error } = await supabaseAdmin
        .from("tenants")
        .select("slug, languages")
        .limit(1);

      if (error) {
        dbCheck = { status: "error", error: error.message };
      } else {
        dbCheck = { status: "connected", error: null };
      }

      // Try to generate params
      const { data: allTenants } = await supabaseAdmin
        .from("tenants")
        .select("slug, languages");

      if (allTenants) {
        const paramCount = allTenants.reduce((acc: number, t: any) => {
          return acc + (t.languages?.length || 1);
        }, 0);
        params = { configured: true, count: paramCount, error: null };
      }
    } else {
      dbCheck = { status: "no_credentials", error: "Missing env vars" };
    }
  } catch (error: any) {
    dbCheck = { status: "exception", error: error.message };
  }

  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", fontSize: "12px", lineHeight: "1.6" }}>
      <h1>🔧 Vercel Deployment Debug</h1>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "4px" }}>
        <h2>Build Info</h2>
        <pre>{`NODE_ENV: ${process.env.NODE_ENV}
VERCEL: ${process.env.VERCEL ? "✅" : "❌"}
VERCEL_ENV: ${process.env.VERCEL_ENV || "N/A"}
VERCEL_URL: ${process.env.VERCEL_URL || "N/A"}

Next.js Environment:
- NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ SET" : "❌ MISSING"}
- SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ SET" : "❌ MISSING"}
- NEXT_PUBLIC_BASE_URL: ${process.env.NEXT_PUBLIC_BASE_URL || "N/A"}
- GOOGLE_DRIVE_MENU_URL: ${process.env.GOOGLE_DRIVE_MENU_URL ? "✅ SET" : "❌ MISSING"}`}</pre>
      </section>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "4px" }}>
        <h2>Database Connection</h2>
        <pre>{`Status: ${dbCheck.status}
Error: ${dbCheck.error ? JSON.stringify(dbCheck.error) : "None"}`}</pre>
      </section>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc", borderRadius: "4px" }}>
        <h2>Static Params</h2>
        <pre>{`Configured: ${params.configured}
Tenant Routes Found: ${params.count}
Error: ${params.error ? JSON.stringify(params.error) : "None"}`}</pre>
      </section>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #0070f3", backgroundColor: "#e0eeff", borderRadius: "4px" }}>
        <h2>Routes Status</h2>
        <ul>
          <li>
            <a href="/menu/garage-chocolate-croissant/en" style={{ color: "blue" }}>
              Test: /menu/garage-chocolate-croissant/en
            </a>
          </li>
          <li>
            <a href="/api/public/menu?slug=garage-chocolate-croissant&lang=en" style={{ color: "blue" }}>
              Test API: /api/public/menu?slug=garage-chocolate-croissant&lang=en
            </a>
          </li>
        </ul>
      </section>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ffc107", backgroundColor: "#fff3cd", borderRadius: "4px" }}>
        <h2>Next Steps</h2>
        <ol>
          <li>If Database Connection shows "error" → Check Supabase network access</li>
          <li>If params show "0" → No tenants found in database</li>
          <li>Try clicking "Test: /menu/garage-chocolate-croissant/en" link above</li>
          <li>If still 404 → Check Vercel build logs in dashboard</li>
        </ol>
      </section>
    </div>
  );
}
