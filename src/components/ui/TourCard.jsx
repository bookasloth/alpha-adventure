import Link from "next/link";
import Image from "next/image";

// Tour card matching the legacy .package-card markup (same as trek cards).
export default function TourCard({ tour }) {
  const href = `/tour-packages/${tour.slug}`;
  return (
    <div className="package-card h-full">
      <div className="package-img-wrap">
        <Link href={href} className="package-img relative block aspect-[4/3]">
          <Image
            src={tour.image || "/assets/img/home2/destination-img1.jpg"}
            alt={tour.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </Link>
        {tour.type && <div className="batch"><span>{tour.type}</span></div>}
      </div>
      <div className="package-content">
        <h5><Link href={href}>{tour.title}</Link></h5>
        <div className="location-and-time">
          {tour.duration && <span>{tour.duration}</span>}
        </div>
        <div className="btn-and-price-area">
          <Link href={href} className="primary-btn1"><span>Book Now</span><span>Book Now</span></Link>
          <div className="price-area">
            <h6>Per Person</h6>
            <span>₹{Number(tour.price || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
