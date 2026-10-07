import "server-only";

// Shared HMAC signing secret for short-lived bearer tokens (booking pay-tokens,
// email-verify links). Prefers a dedicated TOKEN_SIGNING_SECRET; falls back to
// the service-role key / CRON_SECRET so already-issued tokens keep validating
// (key reuse is not ideal, but back-compatible — set TOKEN_SIGNING_SECRET to
// separate concerns). In production a missing secret is fatal: no insecure
// default, so tokens can never be forged against a known constant (audit M3).
export function tokenSigningSecret(): string {
  const s =
    process.env.TOKEN_SIGNING_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CRON_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("No token signing secret configured (set TOKEN_SIGNING_SECRET)");
  }
  return "dev-only-insecure";
}
