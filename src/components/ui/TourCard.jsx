import Link from "next/link";

// Reusable tour-package card.
export default function TourCard({ tour }) {
  return (
    <Link href={`/tour-packages/${tour.slug}`} className="card group block hover:-translate-y-1 transition-transform duration-300">
      <div className="relative h-56 overflow-hidden">
        <img
          src={tour.image}
          alt={tour.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
          {tour.type}
        </span>
        <span className="absolute bottom-3 right-3 bg-ink/80 text-white text-xs font-medium px-3 py-1 rounded-full">
          {tour.duration}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-ink group-hover:text-primary transition-colors">
          {tour.title}
        </h3>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="block text-xs text-gray-400">Per Person</span>
            <span className="text-lg font-bold text-primary">₹{tour.price.toLocaleString("en-IN")}</span>
          </div>
          <span className="text-sm font-semibold bg-primary text-white px-4 py-2 rounded-full group-hover:bg-primary-dark">
            Book Now
          </span>
        </div>
      </div>
    </Link>
  );
}
