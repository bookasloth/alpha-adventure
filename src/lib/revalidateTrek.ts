import { revalidatePath } from "next/cache";

// Trek group keys used by /treks/upcoming-treks/[group] (href: `${key}-treks`).
const TREK_GROUPS = ["sahyadri", "himalayan", "central"] as const;

// Revalidate every public surface a trek change can affect, so an admin edit
// (content OR departures) shows on the live site immediately instead of waiting
// out the page's 5-minute ISR window. Pass the slug to also refresh that trek's
// detail and booking pages.
export function revalidatePublicTrek(slug?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/"); // home "Popular/Top Treks" sliders
  revalidatePath("/treks/upcoming-treks");
  revalidatePath("/treks/trips-near-nagpur");
  revalidatePath("/treks/backpacking-trips");
  for (const g of TREK_GROUPS) revalidatePath(`/treks/upcoming-treks/${g}-treks`);
  if (slug) {
    revalidatePath(`/treks/${slug}`);
    revalidatePath(`/book/${slug}`);
  }
}
