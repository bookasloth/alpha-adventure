import Link from "next/link";
import { img } from "@/lib/assets";
import { site } from "@/data/site";

// Full trek detail view, driven by a single trek object.
export default function TrekDetail({ trek }) {
  const gallery = trek.gallery?.length ? trek.gallery : [trek.image, trek.image, trek.image];

  return (
    <>
      <section className="relative bg-dark text-white">
        <div className="absolute inset-0 bg-cover bg-center opacity-40" style={{ backgroundImage: `url(${trek.image})` }} />
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="container-px relative py-16">
          <nav className="text-sm text-white/70 mb-3">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <Link href="/treks/upcoming-treks" className="hover:text-white">Treks</Link>
            <span className="mx-2">/</span>
            <span className="text-white">{trek.title}</span>
          </nav>
          {trek.badge && <span className="inline-block bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">{trek.badge}</span>}
          <h1 className="text-3xl sm:text-4xl font-bold">{trek.title}</h1>
          <p className="mt-2 text-white/80">{trek.location} · {trek.duration}</p>
        </div>
      </section>

      <div className="container-px py-14 grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 mb-8">
            {gallery.map((g, i) => (
              <img key={i} src={g} alt={`${trek.title} ${i + 1}`} className="rounded-xl2 h-40 object-cover w-full" />
            ))}
          </div>
          <h2 className="text-2xl font-bold text-ink mb-3">About this trek</h2>
          <p className="text-gray-600 leading-relaxed">{trek.description}</p>
          <p className="mt-4 text-gray-600 leading-relaxed">
            All our batches include experienced guides, safety briefings and first-aid support. Transport, stay and
            meals can be added while booking. Reach out to plan a custom itinerary for your group.
          </p>

          <h3 className="text-xl font-bold text-ink mt-8 mb-3">Highlights</h3>
          <ul className="grid sm:grid-cols-2 gap-2 text-gray-600">
            <li>✓ Expert local trek leaders</li>
            <li>✓ Batch-based scheduling</li>
            <li>✓ Safety & first-aid kit</li>
            <li>✓ Leave-no-trace practice</li>
          </ul>
        </div>

        <aside>
          <div className="card p-6 sticky top-20">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="block text-xs text-gray-400">Per Person</span>
                <span className="text-2xl font-bold text-primary">₹{trek.price.toLocaleString("en-IN")}</span>
              </div>
              <span className="text-sm text-gray-500">{trek.duration}</span>
            </div>
            <a href={site.whatsapp} target="_blank" rel="noreferrer" className="btn-primary w-full mt-5">
              Book / Enquire on WhatsApp
            </a>
            <Link href="/contact" className="btn-dark w-full mt-3">Customise This Trek</Link>
            <p className="text-xs text-gray-400 mt-4 text-center">Free cancellation up to 48h before the batch.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
