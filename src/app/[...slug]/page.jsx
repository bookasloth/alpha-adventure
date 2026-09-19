import Link from "next/link";

// Generic placeholder for secondary marketing/legal pages (privacy, terms,
// safety, corporate, etc.) referenced across the site. Edit freely or replace
// with a real page by creating app/<route>/page.jsx.
export default function PlaceholderPage({ params }) {
  const slug = Array.isArray(params.slug) ? params.slug : [params.slug];
  const title = slug[slug.length - 1]
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return (
    <section className="section">
      <div className="container-px max-w-3xl text-center">
        <span className="text-primary font-semibold uppercase tracking-wide text-sm">Alpha Adventures</span>
        <h1 className="section-title mt-2">{title}</h1>
        <p className="mt-4 text-gray-600 leading-relaxed">
          This page is part of the site structure and is ready for your content. Add the copy in
          a dedicated route file (e.g. <code className="text-primary">app/{slug.join("/")}/page.jsx</code>) to publish it.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/" className="btn-primary">Back Home</Link>
          <Link href="/contact" className="btn-dark">Contact Us</Link>
        </div>
      </div>
    </section>
  );
}
