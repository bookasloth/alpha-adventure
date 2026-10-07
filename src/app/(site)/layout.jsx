import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteChrome from "@/components/layout/SiteChrome";
import MagicCursor from "@/components/layout/MagicCursor";
import MegaMenu from "@/components/layout/MegaMenu";
import TemplateScripts from "@/components/TemplateScripts";

// Legacy template CSS — loaded only for the (site) group (content, listings,
// detail, booking, dashboard), i.e. every route that renders Pattern A/B markup
// or the site chrome. The Tailwind-only trees at app/ root (auth + admin) skip
// all of this (audit §3.5). Next hoists these <link>s into <head>.
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

export default function SiteLayout({ children }) {
  return (
    <>
      {templateCss.map((f) => (
        <link key={f} rel="stylesheet" href={`/assets/css/${f}`} />
      ))}
      <MagicCursor />
      <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
        {children}
      </SiteChrome>
      <MegaMenu />
      <TemplateScripts />
    </>
  );
}
