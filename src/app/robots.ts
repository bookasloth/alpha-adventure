import type { MetadataRoute } from "next";
import { abs } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/user-dashboard",
          "/account",
          "/book/",
          "/api/",
          "/login",
          "/signup",
          "/forgot-password",
          "/reset-password",
          "/verify-email",
        ],
      },
    ],
    sitemap: abs("/sitemap.xml"),
    host: abs("/"),
  };
}
