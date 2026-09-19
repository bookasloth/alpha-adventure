import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import GalleryDetailScripts from "@/components/GalleryDetailScripts";
import { galleryPages, gallerySlugSet, getGalleryPage } from "@/data/gallery-details";
import { galleryDetailHtml } from "@/lib/galleryDetailHtml";

const galleryDetailInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/gallery-detail-init.js"),
  "utf8"
);

export const dynamicParams = false;

export function generateStaticParams() {
  return galleryPages.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }) {
  const page = getGalleryPage(params.slug);
  if (!page) {
    return { title: "Gallery - Alpha Adventures" };
  }
  return {
    title: `${page.title} Photo Gallery - Alpha Adventures`,
    description: `Explore ${page.title} through every season. Stunning photography of summer, monsoon, winter and spring adventures.`,
  };
}

// Serves the original gallery detail page body verbatim, parameterized by slug.
export default function GalleryDetailPage({ params }) {
  const page = getGalleryPage(params.slug);
  if (!page || !gallerySlugSet.has(params.slug)) {
    notFound();
  }

  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: galleryDetailHtml(page) }}
      />
      <GalleryDetailScripts initCode={galleryDetailInit} />
    </>
  );
}