// One-time (idempotent) import of the static src/data/treks.js catalog into the
// Supabase `treks` table so the listing pages can read from the DB.
// Requires migration 0012 (group/tags/badge columns) to be applied first.
//
//   node scripts/import-treks.mjs
//
// Existing treks (with curated detail) only get their listing fields set
// (group/tags/badge); missing treks are inserted with basic detail.
import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";

// treks.js uses an extensionless `../lib/assets` import that Node ESM won't
// resolve. Load it via a temp module with img() inlined (assets.js has no other
// deps). img(p) => "/assets/img/" + p (matches src/lib/assets.js).
async function loadStaticTreks() {
  // Static paths are relative (e.g. "home2/x.jpg"), so a plain prefix matches
  // src/lib/assets.js's img() without needing its leading-slash strip.
  const src = readFileSync("src/data/treks.js", "utf8")
    .replace(/import\s*\{\s*img\s*\}\s*from\s*["']\.\.\/lib\/assets["'];?/,
      'const img = (p) => "/assets/img/" + String(p);');
  const tmp = "src/data/__treks_import_tmp.mjs";
  writeFileSync(tmp, src);
  try {
    return (await import(pathToFileURL(tmp).href + "?t=" + Date.now())).treks;
  } finally {
    rmSync(tmp, { force: true });
  }
}
const STATIC = await loadStaticTreks();

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const REGION = { sahyadri: "Sahyadri", himalayan: "Himalayan", central: "Central India" };
const difficultyOf = (tags = []) =>
  tags.includes("difficult") ? "difficult" : tags.includes("moderate") ? "moderate" : "beginner";

const { data: existing, error: exErr } = await admin.from("treks").select("slug");
if (exErr) { console.error("read existing failed:", exErr.message); process.exit(1); }
const have = new Set((existing ?? []).map((r) => r.slug));

let updated = 0, inserted = 0, failed = 0;
const toInsert = [];

for (const t of STATIC) {
  const listing = { group: t.group ?? null, tags: t.tags ?? [], badge: t.badge || null };
  if (have.has(t.slug)) {
    const { error } = await admin.from("treks").update(listing).eq("slug", t.slug);
    if (error) { console.error("update", t.slug, error.message); failed++; } else updated++;
  } else {
    toInsert.push({
      slug: t.slug,
      title: t.title,
      location: t.location ?? null,
      state: t.state ?? null,
      ...listing,
      summary: t.description ?? null,
      overview: t.description ?? null,
      base_price: Math.round((t.price ?? 0) * 100),
      hero_image: t.image ?? null,
      duration_label: t.duration ?? null,
      difficulty: difficultyOf(t.tags),
      region: REGION[t.group] ?? null,
      status: "published",
    });
  }
}

if (toInsert.length) {
  // Insert in chunks to stay well under any payload limits.
  for (let i = 0; i < toInsert.length; i += 25) {
    const chunk = toInsert.slice(i, i + 25);
    const { error } = await admin.from("treks").insert(chunk);
    if (error) { console.error("insert chunk failed:", error.message); failed += chunk.length; }
    else inserted += chunk.length;
  }
}

console.log(`done — updated ${updated}, inserted ${inserted}, failed ${failed}, total static ${STATIC.length}`);
