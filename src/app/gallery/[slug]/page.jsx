import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import GalleryDetailScripts from "@/components/GalleryDetailScripts";
import { SEASONS } from "@/data/gallery-details";
import { galleryDetailHtml } from "@/lib/galleryDetailHtml";
import { getGalleryAlbum } from "@/lib/galleryListing";

export const dynamic = "force-dynamic";

const galleryDetailInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/gallery-detail-init.js"),
  "utf8",
);

export async function generateMetadata({ params }) {
  const album = await getGalleryAlbum(params.slug);
  if (!album) return { title: "Gallery - Alpha Adventures" };
  return {
    title: `${album.title} Photo Gallery - Alpha Adventures`,
    description: `Explore ${album.title} through every season. Stunning photography of summer, monsoon, winter and spring adventures.`,
  };
}

export default async function GalleryDetailPage({ params }) {
  const album = await getGalleryAlbum(params.slug);
  if (!album) notFound();

  // Album metadata from the DB; the seasonal photo grids are the shared template.
  const page = { slug: album.slug, title: album.title, hero: album.hero, heroAlt: album.hero_alt, seasons: SEASONS };
  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: galleryDetailHtml(page) }} />
      <GalleryDetailScripts initCode={galleryDetailInit} />
    </>
  );
}
