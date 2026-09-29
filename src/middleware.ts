import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

// Legacy gallery-detail.php slugs (preserved from the old PHP site).
const KNOWN_SLUGS = new Set([
  "harishchandragad-trek",
  "kalsubai-peak-trek",
  "rajmachi-fort-trek",
  "kedarkantha-trek",
  "hampta-pass-trek",
  "valley-of-flowers",
  "seven-sisters-hill-trek",
  "silver-falls",
  "scenic-kerala-tour",
]);

export async function middleware(request: NextRequest) {
  // Legacy .php rewrite (unchanged behaviour).
  if (request.nextUrl.pathname === "/gallery-detail.php") {
    const slug = request.nextUrl.searchParams.get("slug");
    const dest = slug && KNOWN_SLUGS.has(slug) ? `/gallery/${slug}` : "/gallery";
    return NextResponse.rewrite(new URL(dest, request.url));
  }
  // Session refresh + /account gate.
  return updateSession(request);
}

export const config = {
  matcher: [
    "/gallery-detail.php",
    // Only refresh/gate on auth-relevant routes. Running updateSession on EVERY
    // route made link prefetches fire concurrent getUser()/token refreshes;
    // Supabase refresh tokens are single-use (rotation), so racing requests got
    // "token already used" and the session was cleared — random logouts. These
    // areas are the only ones that read the session, and login/booking actions
    // manage their own cookies, so nothing else needs the middleware.
    "/account/:path*",
    "/user-dashboard/:path*",
    "/admin/:path*",
  ],
};
