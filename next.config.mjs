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
  // 301s: one canonical trek URL (/treks/<slug>) + guides grouped under /guides.
  async redirects() {
    const guides = ["packing-checklist", "fitness-requirements", "beginner-trek-guide", "safety-guidelines", "responsible-travel"];
    return [
      { source: "/backpacking-trips/detail/spiti-backpacking-trip", destination: "/treks/spiti-valley", permanent: true },
      { source: "/backpacking-trips/detail/:slug", destination: "/treks/:slug", permanent: true },
      { source: "/trips-near-nagpur/detail/:slug", destination: "/treks/:slug", permanent: true },
      ...guides.map((g) => ({ source: `/${g}`, destination: `/guides/${g}`, permanent: true })),
    ];
  },
};

export default nextConfig;
