import "server-only";
import { waitUntil } from "@vercel/functions";

// Run a promise AFTER the response is sent without blocking it. On Vercel,
// waitUntil keeps the serverless function alive until the promise settles (a
// bare fire-and-forget would be frozen the moment we return). Off Vercel (local
// dev, `next start`, any long-lived Node), there's no request context so
// waitUntil throws — fall back to a plain detached promise, which is fine there.
export function background(promise: Promise<unknown>) {
  // Log failures — a swallowed background task (e.g. a failed OTP email) is
  // invisible otherwise, which is exactly how a broken send goes unnoticed.
  const p = Promise.resolve(promise).catch((e) =>
    console.error("[background] task failed:", (e as Error)?.message ?? e),
  );
  try {
    waitUntil(p);
  } catch {
    void p;
  }
}
