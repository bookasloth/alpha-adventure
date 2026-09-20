import { notFound } from "next/navigation";
import TrekDetail from "@/components/treks/TrekDetail";
import { getTrekBySlug } from "@/lib/trekDetail";

// Supabase-backed; render per request (uses cookies() via the SSR client).
export async function generateMetadata({ params }) {
  const trek = await getTrekBySlug(params.slug);
  return {
    title: trek ? trek.title : "Trek",
    description: trek?.summary ?? undefined,
  };
}

export default async function TrekDetailPage({ params }) {
  const trek = await getTrekBySlug(params.slug);
  if (!trek) return notFound();
  return <TrekDetail trek={trek} />;
}
