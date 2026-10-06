import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ponytail: keep Supabase out of server vendor-chunks. A cached/incremental
  // build can emit a page.js that requires ./vendor-chunks/@supabase.js without
  // re-emitting the chunk -> MODULE_NOT_FOUND -> 500 on every DB route. Loading
  // it from node_modules at runtime avoids that entirely.
  experimental: {
    serverComponentsExternalPackages: ["@supabase/ssr", "@supabase/supabase-js"],
    // Pattern B pages read src/data/orig-*.html and *-init.js at runtime via
    // fs.readFileSync(path.join(process.cwd(), ...)). process.cwd() is not
    // statically analyzable, so Next's file tracer never bundles those files
    // into the serverless function -> ENOENT -> 500 on every dynamic route on
    // Vercel (works locally because the files sit on disk). Force-include them.
    outputFileTracingIncludes: {
      "/**": ["./src/data/**"],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "alpha.thegreyhawks.com",
      },
    ],
  },
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
