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
  async rewrites() {
    return [
      {
        source: "/assets/:path*",
        destination: "https://alpha.thegreyhawks.com/assets/:path*",
      },
      {
        source: "/Admin/uploads/:path*",
        destination: "https://alpha.thegreyhawks.com/Admin/uploads/:path*",
      },
    ];
  },
};

export default nextConfig;
