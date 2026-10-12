"use client";

import { useEffect } from "react";
import Link from "next/link";

// Root boundary (admin, auth, anything outside (site)). Site pages use
// (site)/error.jsx, which re-exports this so it renders inside header/footer.
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
