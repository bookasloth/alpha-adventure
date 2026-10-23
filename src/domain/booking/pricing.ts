// Server-authoritative booking price — mirrors price_booking() in
// supabase/migrations/0031_pricing_boarding.sql. Money is bigint paise (INR).
// The client NEVER supplies price/total; the server recomputes from the catalog
// and stores the snapshot on the booking.

export type AddonSpec = { addon_id: string; quantity: number };
export type AddonCatalogRow = { id: string; price: number; active: boolean; trek_id: string };

export type PricingInput = {
  trekId: string;
  basePrice: number; // treks.base_price (paise)
  childPrice?: number | null; // treks.child_price (paise); null => adult rate
  priceOverride?: number | null; // trek_departures.price_override (paise)
  adults: number;
  children: number;
  addons?: AddonSpec[];
  addonCatalog?: AddonCatalogRow[]; // active addons for this trek
  boardingPrice?: number | null; // trek_boarding_locations.price (paise), per traveller; null => none
};

export type PriceSnapshot = {
  currency: "INR";
  priceAdult: number;
  priceChild: number;
  addonsTotal: number;
  boardingTotal: number;
  discountAmount: number;
  taxAmount: number;
  subtotal: number;
  grandTotal: number;
};

export function priceBooking(input: PricingInput): PriceSnapshot {
  const {
    trekId,
    basePrice,
    childPrice,
    priceOverride,
    adults,
    children,
    addons = [],
    addonCatalog = [],
    boardingPrice,
  } = input;

  if (adults < 1) throw new Error("at least one adult required");
  if (children < 0) throw new Error("invalid children count");
  if (!Number.isFinite(basePrice) || basePrice < 0) throw new Error("invalid base price");

  const unitAdult = priceOverride ?? basePrice;
  const unitChild = childPrice ?? unitAdult; // child rate if set, else adult rate

  let addonsTotal = 0;
  for (const a of addons) {
    const row = addonCatalog.find((c) => c.id === a.addon_id && c.trek_id === trekId && c.active);
    if (!row) throw new Error("invalid addon");
    if (!Number.isInteger(a.quantity) || a.quantity <= 0) throw new Error("invalid addon quantity");
    addonsTotal += row.price * a.quantity;
  }

  if (boardingPrice != null && (!Number.isFinite(boardingPrice) || boardingPrice < 0)) throw new Error("invalid boarding");
  // ponytail: per-traveller; flat = drop the pax multiplier
  const boardingTotal = (boardingPrice ?? 0) * (adults + children);

  const subtotal = unitAdult * adults + unitChild * children + addonsTotal + boardingTotal;
  return {
    currency: "INR",
    priceAdult: unitAdult,
    priceChild: unitChild,
    addonsTotal,
    boardingTotal,
    discountAmount: 0,
    taxAmount: 0,
    subtotal,
    grandTotal: subtotal,
  };
}

export type DepositConfig = { type: "none" | "percent" | "flat"; value: number };

// Amount (paise) to charge up front. percent: `value` is a whole 1-100; flat: `value` is paise.
// none / percent-with-0 => full payment. Clamped to [0, grandTotal].
export function computeDeposit(grandTotal: number, cfg: DepositConfig): number {
  let d = grandTotal;
  if (cfg.type === "percent" && cfg.value > 0) d = Math.round((grandTotal * cfg.value) / 100);
  else if (cfg.type === "flat") d = cfg.value;
  return Math.max(0, Math.min(d, grandTotal));
}
