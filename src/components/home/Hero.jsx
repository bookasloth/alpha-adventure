"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { img } from "@/lib/assets";

const slides = [
  {
    title: "Trekking In The Sahyadris Made Easy.",
    text: "Curated treks across Maharashtra with batches, guides, stays and transport sorted in one place.",
    type: "video",
    media: "https://alpha.thegreyhawks.com/assets/video/home2-banner-video.mp4",
  },
  {
    title: "Book Your Next Weekend Trek.",
    text: "Rajmachi, Lohagad, Kalsubai and more weekend friendly trails for beginners to seasoned trekkers.",
    type: "image",
    media: img("home2/banner-img1.jpg"),
    alt: "Weekend treks near Mumbai and Pune",
  },
  {
    title: "Group Batches And Corporate Offsites.",
    text: "Customised treks, camps and adventure experiences for teams, colleges and large groups.",
    type: "image",
    media: img("home2/banner-img2.jpg"),
    alt: "Group and corporate adventure experiences",
  },
];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  const slide = slides[index];

  return (
    <section className="home2-banner-section relative overflow-hidden bg-[#101010] text-white">
      <div className="swiper home2-banner-slider">
        <div className="swiper-wrapper">
          {slides.map((item, i) => (
            <div
              key={item.title}
              className={`swiper-slide absolute inset-0 transition-all duration-700 ease-out ${i === index ? "opacity-100 translate-x-0" : "opacity-0 translate-x-3 pointer-events-none"}`}
            >
              <div className="banner-wrapper relative min-h-[760px] lg:min-h-[860px]">
                {item.type === "video" ? (
                  <div className="banner-video-area absolute inset-0">
                    <video className="h-full w-full object-cover" autoPlay muted loop playsInline src={item.media} />
                  </div>
                ) : (
                  <div className="banner-img-area absolute inset-0">
                    <img src={item.media} alt={item.alt} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/15" />
                <div className="banner-content-wrap relative z-10 flex min-h-[760px] lg:min-h-[860px] items-end lg:items-center">
                  <div className="container mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 lg:pb-0">
                    <div className="banner-content max-w-3xl">
                      <span className="mb-5 inline-flex rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-white/90">
                        Weekend Treks · Fort Treks · Group Batches
                      </span>
                      <h1 className="max-w-2xl text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl">
                        {slide.title}
                      </h1>
                      <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 sm:text-lg">
                        {slide.text}
                      </p>
                      <div className="mt-8 flex flex-wrap gap-4">
                        <Link href="/treks/upcoming-treks" className="primary-btn1">
                          <span>Book Your Next Weekend Trek</span>
                          <span>Book Your Next Weekend Trek</span>
                        </Link>
                        <Link href="/contact" className="primary-btn1 transparent">
                          <span>Plan Custom Itinerary</span>
                          <span>Plan Custom Itinerary</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-3">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={() => setIndex((current) => (current - 1 + slides.length) % slides.length)}
          className="slider-btn banner-slider-prev"
        >
          <span>‹</span>
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={() => setIndex((current) => (current + 1) % slides.length)}
          className="slider-btn banner-slider-next"
        >
          <span>›</span>
        </button>
      </div>
    </section>
  );
}
