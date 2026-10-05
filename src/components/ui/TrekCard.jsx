import Link from "next/link";
import Image from "next/image";

// Reusable trek / experience card. Driven entirely by data.
export default function TrekCard({ trek, href }) {
  const link = href || trek.href || `/treks/${trek.slug}`;
  return (
    <Link href={link} className="card group flex h-full flex-col overflow-hidden hover:-translate-y-1 transition-transform duration-300">
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={trek.image || "/assets/img/home2/destination-img1.jpg"}
          alt={trek.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {trek.badge && (
          <span className="absolute top-3 left-3 bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
            {trek.badge}
          </span>
        )}
        {trek.duration && (
          <span className="absolute bottom-3 right-3 bg-ink/80 text-white text-xs font-medium px-3 py-1 rounded-full">
            {trek.duration}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-ink group-hover:text-primary transition-colors line-clamp-2">
          {trek.title}
        </h3>
        {trek.location && <p className="text-sm text-gray-500 mt-1 line-clamp-1">{trek.location}</p>}
        <div className="mt-auto pt-4 flex items-end justify-between">
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
