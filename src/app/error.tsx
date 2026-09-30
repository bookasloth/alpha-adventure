"use client";

import { useEffect } from "react";
import Link from "next/link";

// ponytail: one root boundary covers every route (Next bubbles render throws to
// the nearest error.tsx; this one is still wrapped by the root layout, so header
// /footer stay). Add a per-segment error.tsx only if a route needs different UX.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="section">
      <div className="container-px max-w-2xl text-center">
        <p className="text-6xl font-bold text-primary">Oops</p>
        <h1 className="section-title mt-2">Something went wrong</h1>
        <p className="mt-3 text-gray-600">
          We hit a snag loading this page. It&apos;s usually temporary — please try again.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button onClick={reset} className="btn-primary inline-flex">
            Try again
          </button>
          <Link href="/" className="btn-outline inline-flex">
            Back to Home
          </Link>
        </div>
      </div>
    </section>
  );
}
