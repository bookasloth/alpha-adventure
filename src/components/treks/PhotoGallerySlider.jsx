"use client";

import { useEffect, useRef, useState } from "react";

// Interactive photo gallery slider for the destination-detail page.
// Shows one large slide at a time with prev/next controls, index counter,
// thumbnail strip and a "+n" overlay on the cover image when there are
// more photos than visible thumbnails.
export default function PhotoGallerySlider({ images = [], title = "Gallery" }) {
  const slides = images.length ? images : [];
  const [index, setIndex] = useState(0);
  const touchX = useRef(null);

  const show = slides.length ? slides[index % slides.length] : "";
  const extraPhotos = Math.max(0, slides.length - 6);

  const prev = () => setIndex((i) => (i - 1 + slides.length) % slides.length);
  const next = () => setIndex((i) => (i + 1) % slides.length);

  useEffect(() => {
    if (!slides.length) return;
    const onKey = (e) => {
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides.length]);

  if (!slides.length) {
    return <p className="text-gray-500 text-sm">No gallery images available.</p>;
  }

  return (
    <div className="space-y-3">
      <div
        className="relative overflow-hidden rounded-xl2 shadow-soft bg-dark"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const diff = e.changedTouches[0].clientX - touchX.current;
          if (diff > 40) prev();
          if (diff < -40) next();
          touchX.current = null;
        }}
      >
        <div className="aspect-[16/9] w-full overflow-hidden">
          <img
            key={index}
            src={show}
            alt={`${title} Gallery Image ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </div>

        <button
          type="button"
          onClick={prev}
          aria-label="Previous image"
          className="absolute left-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur border border-white/20 transition hover:bg-white/35"
        >
          <svg width="20" height="20" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M0 10.0571H22V11.9428H0V10.0571Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M0.942857 11.9429C5.3768 11.9429 9.00115 8.0432 9.00115 3.88457V2.94171H7.11543V3.88457C7.11543 7.04251 4.29566 10.0571 0.942857 10.0571H0V11.9429H0.942857Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M0.942857 10.0571C5.3768 10.0571 9.00115 13.9568 9.00115 18.1154V19.0583H7.11543V18.1154C7.11543 14.9587 4.29566 11.9428 0.942857 11.9428H0V10.0571H0.942857Z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Next image"
          className="absolute right-4 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/20 text-white backdrop-blur border border-white/20 transition hover:bg-white/35"
        >
          <svg width="20" height="20" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path fillRule="evenodd" clipRule="evenodd" d="M22 10.0571H-5.72205e-06V11.9428H22V10.0571Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M21.0571 11.9429C16.6232 11.9429 12.9989 8.0432 12.9989 3.88457V2.94171H14.8846V3.88457C14.8846 7.04251 17.7043 10.0571 21.0571 10.0571H22V11.9429H21.0571Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M21.0571 10.0571C16.6232 10.0571 12.9989 13.9568 12.9989 18.1154V19.0583H14.8846V18.1154C14.8846 14.9587 17.7043 11.9428 21.0571 11.9428H22V10.0571H21.0571Z" />
          </svg>
        </button>

        <span className="absolute bottom-4 right-4 rounded-full bg-ink/70 px-3 py-1 text-xs font-medium text-white backdrop-blur">
          {index + 1} / {slides.length}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {slides.slice(0, 6).map((src, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIndex(i)}
            className={`group relative overflow-hidden rounded-lg border-2 transition ${
              i === index ? "border-primary" : "border-transparent hover:border-primary/50"
            }`}
          >
            <img src={src} alt={`${title} Thumbnail ${i + 1}`} className="h-16 w-full object-cover sm:h-20" />
            {i === 5 && extraPhotos > 0 && (
              <span className="absolute inset-0 grid place-items-center bg-ink/55 text-sm font-semibold text-white">
                +{extraPhotos} Photos
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}