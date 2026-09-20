import { notFound } from "next/navigation";
import TrekDetail from "@/components/treks/TrekDetail";
import TrekCollection from "@/components/treks/TrekCollection";
import { getTrekBySlug } from "@/lib/trekDetail";
import { getCollection } from "@/lib/trekCollection";
import { abs, SITE_URL } from "@/lib/seo";

// /treks/[slug] resolves either a trek detail OR a collection (state/difficulty).
export async function generateMetadata({ params }) {
  const trek = await getTrekBySlug(params.slug);
  if (trek) {
    const canonical = `/treks/${trek.slug}`;
    const desc = trek.summary ?? trek.overview?.slice(0, 155) ?? undefined;
    return {
      title: trek.title,
      description: desc,
      alternates: { canonical },
      openGraph: { title: trek.title, description: desc, url: abs(canonical), images: trek.hero_image ? [abs(trek.hero_image)] : undefined },
    };
  }
  const col = await getCollection(params.slug);
  if (col) {
    const canonical = `/treks/${params.slug}`;
    return { title: col.label, description: col.subtitle, alternates: { canonical }, openGraph: { title: col.label, description: col.subtitle, url: abs(canonical) } };
  }
  return { title: "Trek" };
}

function trekJsonLd(trek) {
  const price = trek.base_price != null ? (trek.base_price / 100).toFixed(0) : undefined;
  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trek.title,
    description: trek.overview ?? trek.summary ?? undefined,
    image: trek.hero_image ? abs(trek.hero_image) : undefined,
    url: abs(`/treks/${trek.slug}`),
    touristType: trek.difficulty,
    provider: { "@type": "TravelAgency", name: "Alpha Adventures", url: SITE_URL },
    ...(price && {
      offers: { "@type": "Offer", price, priceCurrency: "INR", availability: "https://schema.org/InStock", url: abs(`/book/${trek.slug}`) },
    }),
  };
}

export default async function TrekOrCollectionPage({ params }) {
  const trek = await getTrekBySlug(params.slug);
  if (trek) {
    return (
      <>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(trekJsonLd(trek)) }} />
        <TrekDetail trek={trek} />
      </>
    );
  }
  const col = await getCollection(params.slug);
  if (col) return <TrekCollection label={col.label} subtitle={col.subtitle} treks={col.treks} />;
  return notFound();
}
