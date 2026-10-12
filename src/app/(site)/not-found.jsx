import NotFoundContent from "@/components/NotFoundContent";

// 404 inside the site chrome (header, footer, legacy CSS). Reached via
// notFound() from any (site) route, including the [...slug] catch-all that
// every unknown URL lands on.
export default function SiteNotFound() {
  return <NotFoundContent />;
}
