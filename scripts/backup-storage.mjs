// Downloads every file from every Supabase Storage bucket into ./storage-backup.
// No dependencies — uses the Storage REST API directly with the service role key.
//
// Required env vars:
//   SUPABASE_URL              e.g. https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY service role secret (Settings → API)

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SUPABASE_URL = process.env.SUPABASE_URL?.replace(/\/$/, "");
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const OUT_DIR = process.env.OUT_DIR || "storage-backup";

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  process.exit(1);
}

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
};

async function api(path, init = {}) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1${path}`, {
    ...init,
    headers: { ...headers, ...init.headers },
  });
  if (!res.ok) {
    throw new Error(`${init.method || "GET"} ${path} failed: ${res.status} ${await res.text()}`);
  }
  return res;
}

async function listBuckets() {
  const res = await api("/bucket");
  return (await res.json()).map((b) => b.name);
}

// Recursively lists all object paths in a bucket (folders come back as
// entries without an id and must be descended into).
async function listObjects(bucket, prefix = "") {
  const paths = [];
  let offset = 0;
  const limit = 100;
  for (;;) {
    const res = await api(`/object/list/${bucket}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prefix,
        limit,
        offset,
        sortBy: { column: "name", order: "asc" },
      }),
    });
    const items = await res.json();
    for (const item of items) {
      const full = prefix ? `${prefix}/${item.name}` : item.name;
      if (item.id === null) {
        paths.push(...(await listObjects(bucket, full)));
      } else {
        paths.push(full);
      }
    }
    if (items.length < limit) break;
    offset += limit;
  }
  return paths;
}

async function download(bucket, path) {
  const res = await api(`/object/${bucket}/${encodeURIComponent(path).replaceAll("%2F", "/")}`);
  const dest = join(OUT_DIR, bucket, path);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
}

const buckets = await listBuckets();
console.log(`Buckets: ${buckets.join(", ") || "(none)"}`);

let total = 0;
for (const bucket of buckets) {
  const objects = await listObjects(bucket);
  console.log(`${bucket}: ${objects.length} objects`);
  for (const path of objects) {
    await download(bucket, path);
    total++;
  }
}
console.log(`Done. Downloaded ${total} files to ${OUT_DIR}/`);
