// Idempotent import of the static gallery albums into gallery_albums.
// Requires migration 0015. node scripts/import-gallery.mjs
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { galleryPages } from "../src/data/gallery-details.js";

const env = Object.fromEntries(
  readFileSync(".env.local", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#"))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i), l.slice(i + 1).replace(/^["']|["']$/g, "")]; }),
);
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Static hero paths are relative ("assets/img/..."); store absolute for the app.
const abs = (p) => (p ? (p.startsWith("/") || p.startsWith("http") ? p : "/" + p) : null);
const rows = galleryPages.map((p, i) => ({
  slug: p.slug,
  title: p.title,
  subtitle: null,
  hero: abs(p.hero),
  hero_alt: p.heroAlt ?? null,
  sort: i,
  status: "published",
}));

const { error } = await admin.from("gallery_albums").upsert(rows, { onConflict: "slug" });
console.log(error ? "ERR " + error.message : `done — upserted ${rows.length} gallery albums`);
