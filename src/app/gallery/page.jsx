import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import { getGalleryAlbums } from "@/lib/galleryListing";

export const metadata = { title: "Gallery" };
export const revalidate = 300;

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
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <img
                      src={a.hero || "/assets/img/home2/gallery-img1-big.jpg"}
                      alt={a.hero_alt || a.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                    <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2">
                      <h3 className="text-lg font-bold text-white line-clamp-2">{a.title}</h3>
                      <span className="shrink-0 translate-x-1 opacity-0 text-white text-sm font-semibold transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">View →</span>
                    </div>
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
