import { notFound } from "next/navigation";

// Unknown URLs under the site get the real 404 (with the fox game) instead of
// the old "add your content here" placeholder, which leaked dev instructions
// to visitors and turned every typo URL into a soft-404.
export default function CatchAll() {
  notFound();
}
