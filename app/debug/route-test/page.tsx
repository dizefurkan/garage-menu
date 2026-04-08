import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default function DebugPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "monospace", fontSize: "14px" }}>
      <h1>🔍 Route Debug Info</h1>
      
      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
        <h2>Environment Variables</h2>
        <pre>
{`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? "✅ SET" : "❌ MISSING"}
SUPABASE_SERVICE_ROLE_KEY: ${process.env.SUPABASE_SERVICE_ROLE_KEY ? "✅ SET" : "❌ MISSING"}
VERCEL_URL: ${process.env.VERCEL_URL || "❌ MISSING"}
NODE_ENV: ${process.env.NODE_ENV}
`}
        </pre>
      </section>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
        <h2>Next.js Info</h2>
        <pre>
{`Routes:
- /menu/[slug]/[lang] should be pre-generated
- /menu/[slug] should redirect to /menu/[slug]/en
- /api/public/menu?slug=...&lang=... should return menu data

Current URL: ${typeof window !== "undefined" ? window.location.href : "SSR"}`}
        </pre>
      </section>

      <section style={{ marginTop: "1rem", padding: "1rem", border: "1px solid #ccc" }}>
        <h2>Test Link</h2>
        <p>
          <a href="/menu/garage-chocolate-croissant/en" style={{ color: "blue" }}>
            Test: /menu/garage-chocolate-croissant/en
          </a>
        </p>
        <p>
          <a href="/api/public/menu?slug=garage-chocolate-croissant&lang=en" style={{ color: "blue" }}>
            Test API: /api/public/menu?slug=garage-chocolate-croissant&lang=en
          </a>
        </p>
      </section>
    </div>
  );
}
