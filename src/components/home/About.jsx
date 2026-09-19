import Link from "next/link";
import { features } from "@/data/gallery";
import { img } from "@/lib/assets";

// About section + "What You Get" feature grid + Google reviews card.
export default function About() {
  return (
    <section className="section">
      <div className="container-px grid lg:grid-cols-2 gap-12 items-center wow animate fadeInUp" data-wow-delay="200ms" data-wow-duration="1500ms">
        <div>
          <span className="text-primary font-semibold uppercase tracking-wide text-sm">
            About Alpha Adventures
          </span>
          <h2 className="section-title mt-2">Raw, Wild, Untamed</h2>
          <p className="mt-4 text-gray-600 leading-relaxed">
            Alpha Adventures is your trusted crew for treks across the Sahyadris and Maharashtra forts. From
            beginner friendly sunrise hikes to rugged night treks and multi day fort circuits, we plan, guide and
            manage everything so you can just lace up and climb.
          </p>
          <div className="mt-6 inline-flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-3xl font-bold text-primary">6+</span>
            <span className="text-sm text-gray-600">Years<br />of Trek Experience</span>
          </div>
          <Link href="/about-us" className="btn-primary mt-6 ml-4">Know More</Link>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <img src={img("home2/about-img1.jpg")} alt="" className="rounded-xl2 h-44 object-cover w-full" />
          <img src={img("home2/about-img2.jpg")} alt="" className="rounded-xl2 h-44 object-cover w-full mt-8" />
        </div>
      </div>

      {/* What you get */}
      <div className="container-px mt-14 wow animate fadeInUp" data-wow-delay="200ms" data-wow-duration="1500ms">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f) => (
            <Link
              key={f.title}
              href={f.href}
              className="card p-6 hover:bg-primary hover:text-white transition-colors group"
            >
              <h4 className="font-bold text-lg group-hover:text-white">{f.title}</h4>
              <span className="text-sm text-gray-500 group-hover:text-white/80">Learn more →</span>
            </Link>
          ))}
        </div>

        <a
          href="https://www.google.com/maps"
          target="_blank"
          rel="noreferrer"
          className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-ink text-white rounded-xl2 p-6"
        >
          <div className="flex items-center gap-3">
            <img src="https://www.google.com/images/branding/googleg/1x/googleg_standard_color_128dp.png" alt="Google" className="h-8 w-8" />
            <div>
              <p className="font-bold">13,000+ Google Reviews</p>
              <p className="text-sm text-white/70">An average rating of 4.9/5 stars. See what our trekkers say!</p>
            </div>
          </div>
          <span className="btn-primary">Read on Google Maps</span>
        </a>
      </div>
    </section>
  );
}
