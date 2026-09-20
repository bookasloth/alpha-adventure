import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
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
