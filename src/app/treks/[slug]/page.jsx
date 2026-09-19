import { notFound } from "next/navigation";
import TrekDetail from "@/components/treks/TrekDetail";
import { treks, getTrekBySlug } from "@/data/treks";

export function generateStaticParams() {
  return treks.map((t) => ({ slug: t.slug }));
}

export function generateMetadata({ params }) {
  const trek = getTrekBySlug(params.slug);
  return { title: trek ? trek.title : "Trek" };
}

export default function TrekDetailPage({ params }) {
  const trek = getTrekBySlug(params.slug);
  if (!trek) return notFound();
  return <TrekDetail trek={trek} />;
}
