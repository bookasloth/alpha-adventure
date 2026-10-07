import fs from "fs";
import path from "path";
import ShopScripts from "@/components/ShopScripts";

const shopHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-shop.html"),
  "utf8"
);
const shopInit = fs.readFileSync(
  path.join(process.cwd(), "src/data/shop-init.js"),
  "utf8"
);

export const metadata = { title: "Trail Store" };

// Serves the original shop page body verbatim.
export default function ShopPage() {
  return (
    <>
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: shopHtml }}
      />
      <ShopScripts initCode={shopInit} />
    </>
  );
}
