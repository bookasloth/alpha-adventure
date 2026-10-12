import Link from "next/link";
import FoxRunner from "@/components/FoxRunner";

const LINKS = [
  { href: "/treks", label: "Upcoming Treks", icon: "bi-compass" },
  { href: "/backpacking-trips", label: "Backpacking Trips", icon: "bi-backpack" },
  { href: "/trips-near-nagpur", label: "Trips Near Nagpur", icon: "bi-geo-alt" },
  { href: "/travel-calendar", label: "Travel Calendar", icon: "bi-calendar3" },
];

// Shared 404 body: used inside the site chrome ((site)/not-found.jsx) and by
// the bare root not-found for non-site routes (admin, auth).
export default function NotFoundContent() {
  return (
    <section className="section">
      <div className="container-px max-w-3xl text-center">
        <span className="text-sm font-semibold uppercase tracking-wide text-primary">Error 404</span>
        <h1 className="section-title mt-2">Looks like you&apos;ve wandered off the trail</h1>
        <p className="mx-auto mt-3 max-w-xl text-gray-600">
          The page you&apos;re looking for doesn&apos;t exist or has moved. While you&apos;re here, help the fox dodge
          a few cacti — or pick a trail below.
        </p>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <FoxRunner />
          <p className="mt-2 text-xs text-gray-400">Space / ↑ / tap to jump · ↓ to duck</p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-4 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-primary hover:text-primary"
            >
              <i className={`bi ${l.icon} text-xl text-primary`} />
              {l.label}
            </Link>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-primary inline-flex">Back to Home</Link>
          <Link href="/contact" className="btn-dark inline-flex">Contact Us</Link>
        </div>
      </div>
    </section>
  );
}
