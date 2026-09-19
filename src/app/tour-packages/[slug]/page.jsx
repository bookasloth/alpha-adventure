import { notFound } from "next/navigation";
import Link from "next/link";
import { img } from "@/lib/assets";
import { site } from "@/data/site";
import { tourPackages, getTourBySlug } from "@/data/tours";

export function generateStaticParams() {
  return tourPackages.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }) {
  const tour = getTourBySlug(params.slug);
  return { title: tour ? tour.title : "Tour" };
}

export default function TourDetailPage({ params }) {
  const tour = getTourBySlug(params.slug);
  if (!tour) return notFound();
  return (
    <>
      <section className="relative bg-dark text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${tour.image})` }} />
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="container-px relative py-16">
          <nav className="text-sm text-white/70 mb-3">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/tour-packages" className="hover:text-white">Tour Packages</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{tour.title}</span>
          </nav>
          <span className="inline-block bg-accent text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">{tour.type}</span>
          <h1 className="text-3xl sm:text-4xl font-bold">{tour.title}</h1>
          <p className="mt-2 text-white/80">{tour.duration}</p>
        </div>
      </section>

      <div className="container-px py-14 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <img src={tour.image} alt={tour.title} className="rounded-xl2 h-72 w-full object-cover mb-8" />
          <h2 className="text-2xl font-bold text-ink mb-3">Overview</h2>
          <p className="text-gray-600 leading-relaxed">{tour.description}</p>
          <p className="mt-4 text-gray-600 leading-relaxed">
            This package includes accommodation, transport between sectors, guided sightseeing and daily meals as
            per the itinerary. Flights/trains to the base city are excluded unless mentioned. Customise the dates and
            group size with our travel desk.
          </p>
        </div>
        <aside>
          <div className="card p-6 sticky top-20">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="block text-xs text-gray-400">Per Person</span>
                <span className="text-2xl font-bold text-primary">₹{tour.price.toLocaleString("en-IN")}</span>
              </div>
              <span className="text-sm text-gray-500">{tour.duration}</span>
            </div>
            <a href={site.whatsapp} target="_blank" rel="noreferrer" className="btn-primary w-full mt-5">
              Book / Enquire
            </a>
            <Link href="/contact" className="btn-dark w-full mt-3">Talk To Our Desk</Link>
          </div>
        </aside>
      </div>
    </>
  );
}
