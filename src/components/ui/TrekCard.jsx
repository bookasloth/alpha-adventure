import Link from "next/link";

// Reusable trek / experience card. Driven entirely by data.
export default function TrekCard({ trek, href }) {
  const link = href || trek.href || `/treks/${trek.slug}`;
  return (
    <Link href={link} className="card group block hover:-translate-y-1 transition-transform duration-300">
      <div className="relative h-56 overflow-hidden">
        <img
          src={trek.image}
          alt={trek.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {trek.badge && (
          <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
            {trek.badge}
          </span>
        )}
        <span className="absolute bottom-3 right-3 bg-ink/80 text-white text-xs font-medium px-3 py-1 rounded-full">
          {trek.duration}
        </span>
      </div>
      <div className="p-5">
        <h3 className="text-lg font-bold text-ink group-hover:text-primary transition-colors">
          {trek.title}
        </h3>
        <p className="text-sm text-gray-500 mt-1">{trek.location}</p>
        <div className="mt-4 flex items-center justify-between">
          <div>
            <span className="block text-xs text-gray-400">Per Person</span>
            <span className="text-lg font-bold text-primary">₹{trek.price.toLocaleString("en-IN")}</span>
          </div>
          <span className="text-sm font-semibold text-ink group-hover:text-primary">Book Now →</span>
        </div>
      </div>
    </Link>
  );
}
