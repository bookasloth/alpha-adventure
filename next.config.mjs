import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// CSP (audit §3.2). The legacy jQuery/Bootstrap/GSAP template relies on inline
// scripts/styles and eval, so a nonce-based policy would break every Pattern B
// page — we keep 'unsafe-inline'/'unsafe-eval' for scripts+styles and instead
// bank the directives that are pure wins here: frame-ancestors/object-src/
// base-uri lock out clickjacking + plugin/base-tag injection, and the src
// allow-lists pin network/asset origins to self + Supabase + the legacy image
// host. Tighten script-src with nonces if/when Pattern B is retired.
const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").origin;
  } catch {
    return "";
  }
})();
const supabaseWs = supabaseOrigin ? supabaseOrigin.replace(/^https/, "wss") : "";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  `img-src 'self' data: blob: https://alpha.thegreyhawks.com https://www.google.com https://images.unsplash.com ${supabaseOrigin}`.trim(),
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}`.trim(),
  "frame-src 'self'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ponytail: keep Supabase out of server vendor-chunks. A cached/incremental
  // build can emit a page.js that requires ./vendor-chunks/@supabase.js without
  // re-emitting the chunk -> MODULE_NOT_FOUND -> 500 on every DB route. Loading
  // it from node_modules at runtime avoids that entirely.
  // Next 15: both moved out of `experimental` to stable top-level keys.
  serverExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
  // Admin image upload (upload/actions.ts) accepts up to 5 MB; Next's default
  // Server Action body cap is 1 MB, which made 1-5 MB uploads throw.
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  // Pattern B pages read src/data/orig-*.html and *-init.js at runtime via
  // fs.readFileSync(path.join(process.cwd(), ...)). process.cwd() is not
  // statically analyzable, so Next's file tracer never bundles those files
  // into the serverless function -> ENOENT -> 500 on every dynamic route on
  // Vercel (works locally because the files sit on disk). Force-include them.
  outputFileTracingIncludes: {
    "/**": ["./src/data/**"],
  },
  // Template images are self-hosted under public/assets. Admin uploads
  // (ImageField -> Supabase Storage `media` bucket) are stored as absolute
  // Supabase URLs and rendered by next/image in TrekCard/TourCard/TrekDetail,
  // which throws for an unlisted host - so allow exactly that bucket path.
  images: supabaseOrigin
    ? { remotePatterns: [{ protocol: "https", hostname: new URL(supabaseOrigin).hostname, pathname: "/storage/v1/object/public/**" }] }
    : {},
  // `@/` alias defined here (not only in tsconfig) so it survives Next's
  // tsconfig auto-rewrites and works for both JS and TS files.
  webpack: (config) => {
    config.resolve.alias["@"] = path.resolve(__dirname, "src");
    return config;
  },
  // 301s: four flat sections (/treks, /backpacking-trips, /trips-near-nagpur,
  // /tour-packages) + guides grouped under /guides. Old /treks/<leisure-slug>
  // detail links are redirected to their canonical section at runtime by the
  // wrong-section guard in each [slug] route, so no static rule is needed here.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
        ],
      },
    ];
  },
  async redirects() {
    const guides = ["packing-checklist", "fitness-requirements", "beginner-trek-guide", "safety-guidelines", "responsible-travel"];
    return [
      // Old nested sections -> flat top-level sections.
      { source: "/treks/upcoming-treks", destination: "/treks", permanent: true },
      { source: "/treks/upcoming-treks/:group", destination: "/treks/:group", permanent: true },
      { source: "/treks/backpacking-trips", destination: "/backpacking-trips", permanent: true },
      { source: "/treks/backpacking-trips/:rest*", destination: "/backpacking-trips/:rest*", permanent: true },
      { source: "/treks/trips-near-nagpur", destination: "/trips-near-nagpur", permanent: true },
      { source: "/treks/trips-near-nagpur/:rest*", destination: "/trips-near-nagpur/:rest*", permanent: true },
      // Legacy /<section>/detail/<slug> -> canonical /<section>/<slug>.
      { source: "/backpacking-trips/detail/spiti-backpacking-trip", destination: "/backpacking-trips/spiti-valley", permanent: true },
      { source: "/backpacking-trips/detail/:slug", destination: "/backpacking-trips/:slug", permanent: true },
      { source: "/trips-near-nagpur/detail/:slug", destination: "/trips-near-nagpur/:slug", permanent: true },
      ...guides.map((g) => ({ source: `/${g}`, destination: `/guides/${g}`, permanent: true })),
    ];
  },
};

export default nextConfig;
