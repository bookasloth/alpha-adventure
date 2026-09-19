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
    // Run on app routes to refresh the session; skip Next internals & static assets.
    "/((?!_next/static|_next/image|favicon.ico|assets/|.*\\.[\\w]+$).*)",
  ],
};
