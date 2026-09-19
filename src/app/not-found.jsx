import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container-px max-w-2xl text-center">
        <p className="text-6xl font-bold text-primary">404</p>
        <h1 className="section-title mt-2">Page not found</h1>
        <p className="mt-3 text-gray-600">The trail you followed doesn&apos;t exist. Let&apos;s get you back on track.</p>
        <Link href="/" className="btn-primary mt-6 inline-flex">Back to Home</Link>
      </div>
    </section>
  );
}
