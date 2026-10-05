import Link from "next/link";

// Trek card matching the homepage "Popular" slider card (.package-card from the
// legacy style.css): image + badge, title, location · duration, Book Now + price.
// Driven by the ListingTrek shape from trekListing.
const FALLBACK = "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=800&q=80";

export default function PackageCard({ trek }) {
  const href = trek.href || `/treks/${trek.slug}`;
  return (
    <div className="package-card">
      <div className="package-img-wrap">
        <Link href={href} className="package-img">
          <img src={trek.image || FALLBACK} alt={trek.title} />
        </Link>
        {trek.badge && (
          <div className="batch"><span>{trek.badge}</span></div>
        )}
      </div>
      <div className="package-content">
        <h5><Link href={href}>{trek.title}</Link></h5>
        <div className="location-and-time">
          {trek.location && (
            <div className="location">
              <svg width="14" height="14" viewBox="0 0 14 14" xmlns="http://www.w3.org/2000/svg"><path d="M6.83615 0C3.77766 0 1.28891 2.48879 1.28891 5.54892C1.28891 7.93837 4.6241 11.8351 6.05811 13.3994C6.25669 13.6175 6.54154 13.7411 6.83615 13.7411C7.13076 13.7411 7.41561 13.6175 7.6142 13.3994C9.04821 11.8351 12.3834 7.93833 12.3834 5.54892C12.3834 2.48879 9.89464 0 6.83615 0ZM6.83618 8.54554C8.4624 8.54554 9.7807 7.22723 9.7807 5.60102C9.7807 3.9748 8.4624 2.65649 6.83618 2.65649C5.20997 2.65649 3.89166 3.9748 3.89166 5.60102C3.89166 7.22723 5.20997 8.54554 6.83618 8.54554Z" /></svg>
              <Link href={href}>{trek.location}</Link>
            </div>
          )}
          {trek.duration && (
            <>
              <svg className="arrow" width="25" height="6" viewBox="0 0 25 6" xmlns="http://www.w3.org/2000/svg"><path d="M0 3L5 5.88675V0.113249L0 3ZM25 3L20 0.113249V5.88675L25 3ZM4.5 3.5H20.5V2.5H4.5V3.5Z" /></svg>
              <span>{trek.duration}</span>
            </>
          )}
        </div>
        <div className="btn-and-price-area">
          <Link href={href} className="primary-btn1"><span>Book Now</span><span>Book Now</span></Link>
          <div className="price-area"><h6>Per Person</h6><span>₹{Number(trek.price || 0).toLocaleString("en-IN")}</span></div>
        </div>
      </div>
    </div>
  );
}
