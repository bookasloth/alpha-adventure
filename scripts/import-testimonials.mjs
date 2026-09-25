// Idempotent import of static src/data/testimonials.js into the testimonials
// table. Requires migration 0014 (avatar_url). node scripts/import-testimonials.mjs
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

async function loadStatic() {
  const src = readFileSync("src/data/testimonials.js", "utf8")
    .replace(/import\s*\{\s*img\s*\}\s*from\s*["']\.\.\/lib\/assets["'];?/,
      'const img = (p) => "/assets/img/" + String(p);');
  const tmp = "src/data/__testi_import_tmp.mjs";
  writeFileSync(tmp, src);
  try { return (await import(pathToFileURL(tmp).href + "?t=" + Date.now())).testimonials; }
  finally { rmSync(tmp, { force: true }); }
}

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const STATIC = await loadStatic();
const names = STATIC.map((t) => t.name);
// Idempotent: clear previously-seeded rows (by author), then insert fresh.
await admin.from("testimonials").delete().in("author_name", names);
const rows = STATIC.map((t, i) => ({
  author_name: t.name,
  role: t.role ?? null,
  rating: t.rating ?? 5,
  body: t.text,
  avatar_url: t.image ?? null,
  status: "published",
  position: i,
}));
const { error } = await admin.from("testimonials").insert(rows);
console.log(error ? "ERR " + error.message : `done — inserted ${rows.length} testimonials`);
