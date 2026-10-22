import Link from "next/link";
import { site } from "@/data/site";
import { trekCostBySlug, tripCostBySlug, tourTripCostBySlug } from "@/data/route-pricing";

const phoneHref = site.phone ? `tel:${site.phone.replace(/[^+\d]/g, "")}` : null;

// Desktop: two-column table. Mobile: stacked route/price rows — same data,
// no horizontal overflow on small screens.
function PricingTable({ rows }) {
  const route = (r) => (
    <>
      <span className="font-medium text-ink">{r.route}</span>
      {r.sub && <span className="mt-0.5 block text-xs font-bold text-ink">{r.sub}</span>}
      {r.subItalic && <span className="block text-xs italic text-gray-500">{r.subItalic}</span>}
    </>
  );
  const cost = (r) => (
    <>
      <span className="font-bold text-primary">{r.price}</span>{" "}
      <span className="text-xs text-gray-500">/ Person</span>
    </>
  );

  return (
    <>
      <table className="hidden w-full table-fixed border-collapse text-center text-sm sm:table">
        <thead>
          <tr className="bg-primary text-white">
            <th className="w-3/5 border border-primary-dark/40 px-4 py-3 font-bold">
              Pickup - Drop
            </th>
            <th className="border border-primary-dark/40 px-4 py-3 font-bold">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.route} className="even:bg-page/60">
              <td className="border border-line px-4 py-3.5 align-middle">{route(r)}</td>
              <td className="border border-line px-4 py-3.5 align-middle">{cost(r)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="overflow-hidden rounded-xl2 border border-line/70 text-sm sm:hidden">
        <div className="bg-primary px-4 py-3 text-center font-bold text-white">
          Pickup - Drop · Cost
        </div>
        {rows.map((r, i) => (
          <div key={r.route} className={`px-4 py-3 text-center ${i ? "border-t border-line" : ""}`}>
            <div>{route(r)}</div>
            <div className="mt-1">{cost(r)}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function PricingCard({ title, data, bookHref, whatsapp }) {
  if (!data) return null;
  return (
    <div className="flex h-full flex-col rounded-xl2 border border-line/70 bg-white p-6 shadow-soft sm:p-8">
      <h3 className="text-2xl font-extrabold text-ink">{title}</h3>
      <p className="mb-5 text-sm font-medium text-gray-500">including GST</p>

      <div className="min-h-[220px]">
        <PricingTable rows={data.rows} />
      </div>

      {whatsapp ? (
        <a
          href={whatsapp}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2"
        >
          Enquire Now
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      ) : (
        <Link
          href={bookHref}
          className="btn-primary mt-6 inline-flex w-full items-center justify-center gap-2"
        >
          Book Now
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </Link>
      )}

      <div className="mt-6 min-h-[150px] flex-1">
        <h4 className="mb-2 text-sm font-bold text-ink">Note:</h4>
        <ol className="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-gray-600">
          {data.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ol>
      </div>

      {phoneHref && (
        <a
          href={phoneHref}
          className="btn-secondary mt-6 inline-flex w-full items-center justify-center gap-2"
        >
          <i className="bi bi-telephone" /> Call Our Trek Expert
        </a>
      )}
    </div>
  );
}

// Renders the route-pricing cards on a trek detail page. `variant="trek"`
// renders just the Trek Cost card (sidebar); `variant="trip"` renders just the
// Trip Cost card (full-width). Looks up data by slug; renders nothing when the
// requested card has no data for the trek.
export function RoutePricingCard({ slug, bookHref, variant = "trek" }) {
  const data =
    variant === "tour" ? tourTripCostBySlug[slug] : variant === "trip" ? tripCostBySlug[slug] : trekCostBySlug[slug];
  const title = variant === "tour" ? "Trip Cost" : variant === "trip" ? "Trip Cost" : "Trek Cost";
  if (!data) return null;
  // Tour packages enquire over WhatsApp (mirrors the tour sidebar's
  // "Book / Enquire" button); trek/trip cards keep linking to the booking flow.
  const whatsapp = variant === "tour" ? site.whatsapp : null;
  return <PricingCard title={title} data={data} bookHref={bookHref} whatsapp={whatsapp} />;
}

export default function RoutePricingCards({ slug, bookHref }) {
  const trekCost = trekCostBySlug[slug];
  const tripCost = tripCostBySlug[slug];
  if (!trekCost && !tripCost) return null;

  return (
    <div className="mt-16 grid items-stretch gap-6 md:grid-cols-2" id="section-route-pricing">
      <PricingCard title="Trek Cost" data={trekCost} bookHref={bookHref} />
      <PricingCard title="Trip Cost" data={tripCost} bookHref={bookHref} />
    </div>
  );
}
