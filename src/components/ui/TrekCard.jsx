import Link from "next/link";
import Image from "next/image";

// Trek card in the same `package-card` markup as the homepage "Popular Treks"
// slider (styled by legacy style.css), so every listing matches the home page.
export default function TrekCard({ trek, href }) {
  const link = href || trek.href || `/treks/${trek.slug}`;
  return (
    <div className="package-card h-full">
      <div className="package-img-wrap">
        <Link href={link} className="package-img relative block aspect-[4/3]">
          <Image
            src={trek.image || "/assets/img/home2/destination-img1.jpg"}
            alt={trek.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        </Link>
        {trek.badge && <div className="batch"><span>{trek.badge}</span></div>}
      </div>
      <div className="package-content">
        <h5><Link href={link}>{trek.title}</Link></h5>
        <div className="location-and-time">
          {trek.location && (
            <div className="location">
              <i className="bi bi-geo-alt" /> <Link href={link}>{trek.location}</Link>
            </div>
          )}
          {trek.duration && <span>{trek.duration}</span>}
        </div>
        <div className="btn-and-price-area">
          <Link href={link} className="primary-btn1"><span>Book Now</span><span>Book Now</span></Link>
          <div className="price-area">
            <h6>Per Person</h6>
            <span>₹{Number(trek.price || 0).toLocaleString("en-IN")}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
