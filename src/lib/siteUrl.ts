import "server-only";

// Canonical public base URL for links in emails (reset, verify). Prefers an
// explicit env, then the Vercel-provided host, then localhost for dev.
// IMPORTANT: set NEXT_PUBLIC_SITE_URL to the canonical domain in production.
// VERCEL_URL is the per-deployment hostname (changes every deploy) — usable but
// not stable; with neither set, links fall back to localhost, which is why reset
// emails can show a local address.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  if (process.env.NODE_ENV === "production")
    console.error(
      "[siteUrl] NEXT_PUBLIC_SITE_URL unset in production — reset/verify email links will point to http://localhost:3000. Set it to the canonical domain.",
    );
  return "http://localhost:3000";
}
