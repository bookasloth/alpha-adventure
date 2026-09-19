import fs from "fs";
import path from "path";
import BackpackingTripsClient from "@/components/treks/BackpackingTripsClient";

export const metadata = {
  title: "Backpacking Trips",
  description:
    "Coastal escapes, desert circuits, hill stations and Himalayan valleys — curated backpacking across India.",
};

export default function BackpackingTripsPage() {
  const html = fs.readFileSync(
    path.join(process.cwd(), "src/data/orig-backpacking-trips.html"),
    "utf8"
  );

  return (
    <>
      <div suppressHydrationWarning dangerouslySetInnerHTML={{ __html: html }} />
      <BackpackingTripsClient />
    </>
  );
}
