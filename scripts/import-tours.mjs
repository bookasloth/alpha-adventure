// Idempotent import of static src/data/tours.js into the Supabase `tours` table.
// Requires migration 0013 (tours table) applied first.  node scripts/import-tours.mjs
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

async function loadStaticTours() {
  const src = readFileSync("src/data/tours.js", "utf8")
    .replace(/import\s*\{\s*img\s*\}\s*from\s*["']\.\.\/lib\/assets["'];?/,
      'const img = (p) => "/assets/img/" + String(p);');
  const tmp = "src/data/__tours_import_tmp.mjs";
  writeFileSync(tmp, src);
  try {
    return (await import(pathToFileURL(tmp).href + "?t=" + Date.now())).tourPackages;
  } finally {
    rmSync(tmp, { force: true });
  }
}

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const STATIC = await loadStaticTours();
const rows = STATIC.map((t, i) => ({
  slug: t.slug,
  title: t.title,
  type: t.type ?? null,
  duration: t.duration ?? null,
  base_price: Math.round((t.price ?? 0) * 100),
  image: t.image ?? null,
  description: t.description ?? null,
  sort: i,
  status: "published",
}));

const { error } = await admin.from("tours").upsert(rows, { onConflict: "slug" });
console.log(error ? "ERR " + error.message : `done — upserted ${rows.length} tours`);
