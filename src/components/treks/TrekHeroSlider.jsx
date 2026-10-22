"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

// Auto-advancing crossfade slider for the trek detail hero background.
// Images are layered absolutely; the active one fades in over the previous.
export default function TrekHeroSlider({ images = [], title = "", interval = 5000 }) {
  const slides = images.filter(Boolean);
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), interval);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length, interval]);

  if (!slides.length) return null;
  if (slides.length === 1) {
    return (
      <Image src={slides[0]} alt={title} fill priority sizes="100vw"
        aria-hidden="true" style={{ objectFit: "cover", objectPosition: "center" }} />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current == null) return;
        const diff = e.changedTouches[0].clientX - touchX.current;
        if (diff > 40) prev();
        if (diff < -40) next();
        touchX.current = null;
      }}
    >
      {slides.map((src, i) => (
        <Image
          key={src + i}
          src={src}
          alt=""
          fill
          priority={i === 0}
          sizes="100vw"
          className="transition-opacity duration-700"
          style={{ objectFit: "cover", objectPosition: "center", opacity: i === index ? 1 : 0 }}
        />
      ))}

      {/* prev / next */}
      <button type="button" onClick={prev} aria-label="Previous image"
        className="absolute left-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition hover:bg-white/30">
        <i className="bi bi-chevron-left" />
      </button>
      <button type="button" onClick={next} aria-label="Next image"
        className="absolute right-4 top-1/2 z-10 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-white/15 text-white backdrop-blur transition hover:bg-white/30">
        <i className="bi bi-chevron-right" />
      </button>

      {/* dots */}
      <div className="absolute bottom-5 right-6 z-10 flex items-center gap-2">
        {slides.map((_, i) => (
          <button key={i} type="button" aria-label={`Go to image ${i + 1}`}
            onClick={() => setIndex(i)}
            className={`h-2 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"}`} />
        ))}
        <span className="ml-2 text-xs font-medium text-white/80">{index + 1}/{slides.length}</span>
      </div>
    </div>
  );
}
