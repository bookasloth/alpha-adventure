import { notFound } from "next/navigation";
import Link from "next/link";
import { getTourBySlug } from "@/lib/tourListing";
import TourDetail from "@/components/tours/TourDetail";

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
  return <TourDetail tour={tour} />;
}
