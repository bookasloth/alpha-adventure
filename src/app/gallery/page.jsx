import fs from "fs";
import path from "path";
import GalleryScripts from "@/components/GalleryScripts";

const galleryHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-gallery.html"),
  "utf8"
);
const galleryInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/gallery-init.js"),
  "utf8"
);

export const metadata = { title: "Gallery" };

// Serves the original gallery page body verbatim.
export default function GalleryPage() {
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: galleryHtml }}
      />
      <GalleryScripts initCode={galleryInit} />
    </>
  );
}
