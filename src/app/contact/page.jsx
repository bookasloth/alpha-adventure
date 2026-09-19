import fs from "fs";
import path from "path";

const contactHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-contact.html"),
  "utf8"
);

export const metadata = { title: "Contact Us (Need Help?)" };

// Serves the original contact page body verbatim.
export default function ContactPage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: contactHtml }}
    />
  );
}