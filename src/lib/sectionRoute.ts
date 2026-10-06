import { getTrekBySlug } from "./trekDetail";
import { sectionOf, canonicalPath, type Section } from "./sections";

// Resolve a /<section>/<segment> as an item detail.
//  - segment is an item in THIS section        -> { trek }
//  - segment is an item in a DIFFERENT section  -> { redirectTo } (301 canonical)
//  - segment is not an item                     -> null (caller tries a
//    collection listing, else 404)
// getTrekBySlug is React.cache'd, so metadata + body share one fetch.
export async function resolveSectionItem(section: Section, segment: string) {
  const trek = await getTrekBySlug(segment);
  if (!trek) return null;
  if ((sectionOf(trek.group) ?? "treks") === section) return { trek } as const;
  return { redirectTo: canonicalPath({ group: trek.group, slug: trek.slug }) } as const;
}
