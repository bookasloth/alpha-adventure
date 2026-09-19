import fs from "fs";
import path from "path";

const termsHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-terms-and-conditions.html"),
  "utf8"
);

export const metadata = {
  title: "Terms & Conditions",
  description:
    "Read the terms and conditions that apply to bookings and participation in Alpha Adventures treks, trips, expeditions, and outdoor activities.",
};

// Serves the original terms-and-conditions page body verbatim.
export default function TermsAndConditionsPage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: termsHtml }}
    />
  );
}
