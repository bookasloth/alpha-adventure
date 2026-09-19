import fs from "fs";
import path from "path";

const cancellationHtml = fs.readFileSync(
  path.join(process.cwd(), "src/data/orig-cancellation-policy.html"),
  "utf8"
);

export const metadata = {
  title: "Cancellation Policy",
  description:
    "Read our policy regarding booking cancellations, rescheduling, and transfers.",
  keywords: "cancel, refund, rescheduling, transfer, policy",
};

// Serves the original cancellation-policy page body verbatim.
export default function CancellationPolicyPage() {
  return (
    <div
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: cancellationHtml }}
    />
  );
}