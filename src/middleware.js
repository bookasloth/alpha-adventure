import { NextResponse } from "next/server";

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

export function middleware(request) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (slug && KNOWN_SLUGS.has(slug)) {
    return NextResponse.rewrite(new URL(`/gallery/${slug}`, request.url));
  }
  return NextResponse.rewrite(new URL("/gallery", request.url));
}

export const config = {
  matcher: "/gallery-detail.php",
};