// Keep only same-origin relative paths for post-auth redirects. Blocks
// open-redirect via ?next=//evil.com, ?next=/\evil.com (browsers normalise \ to
// /, so /\evil.com resolves to //evil.com), absolute URLs, and control chars.
export function safeNext(raw: unknown, fallback = "/user-dashboard"): string {
  if (typeof raw !== "string") return fallback;
  if (!raw.startsWith("/")) return fallback;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  if (/[\\\u0000-\u001F]/.test(raw)) return fallback;
  return raw;
}
