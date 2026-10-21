import { notFound } from "next/navigation";
import Link from "next/link";
import { site } from "@/data/site";
import { getTourBySlug } from "@/lib/tourListing";

export const revalidate = 300;
// Empty list = nothing prebuilt at deploy, but each slug is rendered once on
// first visit and then served from cache (ISR) until revalidate/admin edits.
// Without this the route renders on every request.
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata(props) {
  const params = await props.params;
  const tour = await getTourBySlug(params.slug);
  return { title: tour ? tour.title : "Tour" };
}

export default async function TourDetailPage(props) {
  const params = await props.params;
  const tour = await getTourBySlug(params.slug);
  if (!tour) return notFound();
  return (
    <>
      <section className="breadcrumb-section" style={{ backgroundImage: `url(${tour.image})` }}>
        <div className="container">
          <div className="row">
            <div className="col-lg-12">
              <div className="banner-wrapper">
                <div className="banner-content">
                  <ul className="breadcrumb-list">
                    <li><Link href="/">Home</Link></li>
                    <li><Link href="/tour-packages">Tour Packages</Link></li>
                    <li>{tour.title}</li>
                  </ul>
                  <h1>{tour.title}</h1>
                  <div className="review-area">
                    {tour.type && <span>{tour.type}</span>}
                    {tour.duration && <span>{tour.duration}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="tour-package-details pt-120 mb-120">
        <div className="container">
          <div className="row g-lg-4 gy-5">
            <div className="col-lg-8">
              <div className="tour-package-info">
                <div className="image-group">
                  <img src={tour.image} alt={tour.title} className="img-fluid" />
                </div>
                <h3>Overview</h3>
                <p>{tour.description}</p>
                <p>
                  This package includes accommodation, transport between sectors, guided sightseeing and daily meals as
                  per the itinerary. Flights/trains to the base city are excluded unless mentioned. Customise the dates and
                  group size with our travel desk.
                </p>
              </div>
            </div>
            <div className="col-lg-4">
              <div className="tour-sidebar">
                <div className="booking-form-area">
                  <h4>Starting From</h4>
                  <div className="price-area">
                    <span>₹{Number(tour.price || 0).toLocaleString("en-IN")}</span>
                    <p>Per Person</p>
                  </div>
                  <div className="form-inner">
                    <ul className="price-list">
                      <li><span>Duration</span><span>{tour.duration || "-"}</span></li>
                      {tour.type && <li><span>Type</span><span>{tour.type}</span></li>}
                    </ul>
                    <a href={site.whatsapp} target="_blank" rel="noreferrer" className="primary-btn1 two">Book / Enquire</a>
                    <Link href="/contact" className="primary-btn1 transparent mt-3">Talk To Our Desk</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
