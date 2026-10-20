import Link from "next/link";
import PageHero from "@/components/layout/PageHero";
import { getGalleryAlbums } from "@/lib/galleryListing";

export const metadata = { title: "Gallery" };
export const revalidate = 300;

// Bento spans for a 4-col grid. Each cycle of 5 cards (2x2 + four 1x1) tiles
// exactly 2 rows; a partial tail is spanned so the final rows still fill
// edge-to-edge. Odd counts also span the full width at the sm breakpoint.
function layoutSpans(n) {
  const spans = [];
  for (let i = 0; i < Math.floor(n / 5); i++) {
    spans.push("lg:col-span-2 lg:row-span-2", "", "", "", "");
  }
  const rest = n % 5;
  if (rest === 1) spans.push("lg:col-span-4");
  else if (rest === 2) spans.push("lg:col-span-2", "lg:col-span-2");
  else if (rest === 3) spans.push("lg:col-span-2", "", "");
  else if (rest === 4) spans.push("lg:col-span-2 lg:row-span-2", "lg:col-span-2", "", "");
  if (n % 2 === 1) {
    const last = spans[n - 1];
    spans[n - 1] = last.includes("lg:") ? `${last} sm:col-span-2` : `${last} sm:col-span-2 lg:col-span-1`;
  }
  return spans;
}

export default async function GalleryPage() {
  const albums = await getGalleryAlbums();
  return (
    <>
      <PageHero
        title="Gallery"
        crumb="Gallery"
        subtitle="Moments from the trails — forts, peaks, valleys and the people who climb them."
        fullHeight
      />
      <section className="section">
        <div className="container-px">
          {albums.length === 0 ? (
            <p className="text-center text-gray-500 py-16">No albums yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 auto-rows-[220px] sm:auto-rows-[240px]">
              {layoutSpans(albums.length).map((span, i) => {
                const a = albums[i];
                return (
                  <Link
                    key={a.slug}
                    href={`/gallery/${a.slug}`}
                    className={`group relative overflow-hidden rounded-2xl ${span}`}
                  >
                    <img
                      src={a.hero || "/assets/img/home2/gallery-img1-big.jpg"}
                      alt={a.hero_alt || a.title}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                    <div className="absolute inset-x-4 bottom-4 translate-y-4 space-y-1.5 opacity-0 transition-all duration-300 ease-out group-hover:translate-y-0 group-hover:opacity-100">
                      <h3 className="text-[19px] font-bold text-primary line-clamp-2">{a.title}</h3>
                      {a.trip_type && (
                        <p className="text-[13px] font-semibold uppercase tracking-wider text-primary/80 line-clamp-1">{a.trip_type}</p>
                      )}
                      <span className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary">
                        View Details <span aria-hidden="true">→</span>
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
