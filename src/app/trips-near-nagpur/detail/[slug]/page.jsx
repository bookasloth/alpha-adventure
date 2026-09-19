import { notFound } from "next/navigation";
import TripDetail from "@/components/treks/TripDetail";
import { treks, getTrekBySlug } from "@/data/treks";

// Dynamic destination-details pages for Trips Near Nagpur, e.g.
// /trips-near-nagpur/detail/silver-falls. The seven-sisters-hill-trek page is
// served verbatim from its own static route (seven-sisters-hill-trek/page.jsx).
const STATIC_SLUGS = ["seven-sisters-hill-trek"];

export function generateStaticParams() {
  return treks
    .filter((t) => t.group === "near-nagpur" && !STATIC_SLUGS.includes(t.slug))
    .map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }) {
  const trek = getTrekBySlug(params.slug);
  return { title: trek ? trek.title : "Trip" };
}

export default function TripDetailPage({ params }) {
  const trek = getTrekBySlug(params.slug);
  if (!trek || trek.group !== "near-nagpur") return notFound();
  if (STATIC_SLUGS.includes(params.slug)) return notFound();
  return <TripDetail trek={trek} />;
}