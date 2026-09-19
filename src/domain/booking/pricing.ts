// Server-authoritative booking price — mirrors price_booking() in
// supabase/migrations/0006_booking_engine.sql. Money is bigint paise (INR).
// The client NEVER supplies price/total; the server recomputes from the catalog
// and stores the snapshot on the booking.

export type AddonSpec = { addon_id: string; quantity: number };
export type AddonCatalogRow = { id: string; price: number; active: boolean; trek_id: string };

export type PricingInput = {
  trekId: string;
  basePrice: number; // treks.base_price (paise)
  priceOverride?: number | null; // trek_departures.price_override (paise)
  adults: number;
  children: number;
  addons?: AddonSpec[];
  addonCatalog?: AddonCatalogRow[]; // active addons for this trek
};

export type PriceSnapshot = {
  currency: "INR";
  priceAdult: number;
  priceChild: number;
  addonsTotal: number;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
  grandTotal: number;
};

export function priceBooking(input: PricingInput): PriceSnapshot {
  const {
    trekId,
    basePrice,
    priceOverride,
    adults,
    children,
    addons = [],
    addonCatalog = [],
  } = input;

  if (adults < 1) throw new Error("at least one adult required");
  if (children < 0) throw new Error("invalid children count");
  if (!Number.isFinite(basePrice) || basePrice < 0) throw new Error("invalid base price");

  const unitAdult = priceOverride ?? basePrice;
  const unitChild = unitAdult; // ponytail: no separate child rate in the catalog yet

  let addonsTotal = 0;
  for (const a of addons) {
    const row = addonCatalog.find((c) => c.id === a.addon_id && c.trek_id === trekId && c.active);
    if (!row) throw new Error("invalid addon");
    if (!Number.isInteger(a.quantity) || a.quantity <= 0) throw new Error("invalid addon quantity");
    addonsTotal += row.price * a.quantity;
  }

  const subtotal = unitAdult * adults + unitChild * children + addonsTotal;
  return {
    currency: "INR",
    priceAdult: unitAdult,
    priceChild: unitChild,
    addonsTotal,
    discountAmount: 0,
    taxAmount: 0,
    subtotal,
    grandTotal: subtotal,
  };
}
