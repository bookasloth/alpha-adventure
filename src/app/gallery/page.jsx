import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import { getGalleryAlbums } from "@/lib/galleryListing";

export const metadata = { title: "Gallery" };
export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const albums = await getGalleryAlbums();
  return (
    <>
      <PageHero
        title="Gallery"
        crumb="Gallery"
        subtitle="Moments from the trails — forts, peaks, valleys and the people who climb them."
      />
      <section className="section">
        <div className="container-px">
          {albums.length === 0 ? (
            <p className="text-center text-gray-500 py-16">No albums yet.</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {albums.map((a) => (
                <Link key={a.slug} href={`/gallery/${a.slug}`} className="group card overflow-hidden">
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={a.hero || "/assets/img/home2/gallery-img1-big.jpg"}
                      alt={a.hero_alt || a.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <h3 className="absolute bottom-4 left-4 right-4 text-lg font-bold text-white">{a.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
