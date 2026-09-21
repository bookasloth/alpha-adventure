import "./globals.css";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteChrome from "@/components/layout/SiteChrome";
import MagicCursor from "@/components/layout/MagicCursor";
import TemplateScripts from "@/components/TemplateScripts";
import { site } from "@/data/site";
import { SITE_URL } from "@/lib/seo";

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

const templateCss = [
  "bootstrap.min.css",
  "jquery-ui.css",
  "bootstrap-icons.css",
  "animate.min.css",
  "jquery.fancybox.min.css",
  "swiper-bundle.min.css",
  "slick.css",
  "slick-theme.css",
  "daterangepicker.css",
  "boxicons.min.css",
  "style.css?v=1786605966",
  "card-custom.css",
  "search.css?v=1786605966",
];

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <base href="/" />
        {templateCss.map((f) => (
          <link key={f} rel="stylesheet" href={`/assets/css/${f}`} />
        ))}
      </head>
      <body className="tt-magic-cursor">
        <MagicCursor />
        <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
          {children}
        </SiteChrome>
        <TemplateScripts />
      </body>
    </html>
  );
}