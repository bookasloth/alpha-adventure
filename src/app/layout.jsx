import "./globals.css";
import { site } from "@/data/site";
import { SITE_URL } from "@/lib/seo";

// Root layout is intentionally minimal: <html>/<body> + Tailwind (globals.css)
// + global metadata, nothing else. The legacy jQuery/Bootstrap/GSAP template
// (13 vendor stylesheets + its scripts + site chrome) lives in the (site) route
// group's layout so the Tailwind-only trees that sit directly under app/
// — login, signup, forgot/reset-password, verify-email, admin — don't pay the
// render-blocking cost of CSS they never use (audit §3.5). URLs are unchanged:
// route groups are URL-transparent.
export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${site.name} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: `${site.name} — ${site.tagline}`,
    description: site.description,
    url: SITE_URL,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <base href="/" />
      </head>
      {/* tt-magic-cursor is inert without style.css (which only (site) loads). */}
      <body className="tt-magic-cursor">{children}</body>
    </html>
  );
}
