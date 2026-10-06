import { revalidatePath } from "next/cache";
import { GROUP_ALIASES } from "./sections";

// Revalidate every public surface a trek change can affect, so an admin edit
// (content OR departures) shows on the live site immediately instead of waiting
// out the page's 5-minute ISR window. Pass the slug to also refresh that trek's
// detail and booking pages.
export function revalidatePublicTrek(slug?: string | null) {
  revalidatePath("/admin");
  revalidatePath("/"); // home "Popular/Top Treks" sliders
  revalidatePath("/treks");
  revalidatePath("/backpacking-trips");
  revalidatePath("/trips-near-nagpur");
  for (const alias of Object.keys(GROUP_ALIASES)) revalidatePath(`/treks/${alias}`);
  if (slug) {
    // The slug's canonical detail lives under exactly one section; revalidate
    // all three (the other two are harmless no-ops) plus its booking page.
    revalidatePath(`/treks/${slug}`);
    revalidatePath(`/backpacking-trips/${slug}`);
    revalidatePath(`/trips-near-nagpur/${slug}`);
    revalidatePath(`/book/${slug}`);
  }
}
