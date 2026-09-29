import "server-only";

// Canonical public base URL for links in emails. Prefers an explicit env, falls
// back to the Vercel-provided host, then localhost for dev.
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
