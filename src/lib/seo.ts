import { createClient } from "@supabase/supabase-js";

// Canonical site origin (override in prod via NEXT_PUBLIC_SITE_URL).
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://alphaadventures.in").replace(/\/$/, "");

export const abs = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Public reads are best-effort: sitemap/metadata generation must not crash a
// build when the Supabase env is absent (e.g. a bare local/CI build).
export const isPublicSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Anon Supabase client for public reads in metadata/sitemap (no session needed).
export function publicClient() {
  return createClient(SUPABASE_URL!, SUPABASE_KEY!, { auth: { persistSession: false } });
}

// Published trek slugs + a light payload for sitemap / collections.
export async function listPublishedTreks() {
  if (!isPublicSupabaseConfigured) return [];
  const { data } = await publicClient()
    .from("treks")
    .select("slug,title,state,difficulty,updated_at")
    .eq("status", "published")
    .is("deleted_at", null);
  return data ?? [];
}

// Slugify a state/region label into a collection slug (e.g. "Madhya Pradesh" -> "madhya-pradesh").
export const toSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
