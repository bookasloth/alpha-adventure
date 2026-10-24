import { describe, it, expect } from "vitest";
import { priceBooking, computeDeposit, resolveCharge } from "./pricing";

const TREK = "trek-1";

describe("priceBooking (server-authoritative)", () => {
  it("prices adults at base price", () => {
    const p = priceBooking({ trekId: TREK, basePrice: 129900, adults: 2, children: 0 });
    expect(p.priceAdult).toBe(129900);
    expect(p.subtotal).toBe(259800);
    expect(p.grandTotal).toBe(259800);
    expect(p.currency).toBe("INR");
  });

  it("uses the departure price override when present", () => {
    const p = priceBooking({ trekId: TREK, basePrice: 129900, priceOverride: 99900, adults: 1, children: 0 });
    expect(p.priceAdult).toBe(99900);
    expect(p.grandTotal).toBe(99900);
  });

  it("charges children at the adult rate when no child rate is set", () => {
    const p = priceBooking({ trekId: TREK, basePrice: 100000, adults: 1, children: 2 });
    expect(p.priceChild).toBe(100000);
    expect(p.subtotal).toBe(300000);
  });

  it("uses the child rate when present", () => {
    const p = priceBooking({ trekId: TREK, basePrice: 129900, childPrice: 99900, adults: 2, children: 1 });
    expect(p.priceAdult).toBe(129900);
    expect(p.priceChild).toBe(99900);
    expect(p.subtotal).toBe(129900 * 2 + 99900);
  });

  it("sums valid active addons", () => {
    const p = priceBooking({
      trekId: TREK, basePrice: 100000, adults: 1, children: 0,
      addons: [{ addon_id: "a1", quantity: 2 }],
      addonCatalog: [{ id: "a1", price: 5000, active: true, trek_id: TREK }],
    });
    expect(p.addonsTotal).toBe(10000);
    expect(p.grandTotal).toBe(110000);
  });

  it("rejects an addon not in the active catalog", () => {
    expect(() =>
      priceBooking({
        trekId: TREK, basePrice: 100000, adults: 1, children: 0,
        addons: [{ addon_id: "ghost", quantity: 1 }],
        addonCatalog: [{ id: "a1", price: 5000, active: true, trek_id: TREK }],
      }),
    ).toThrow(/invalid addon/);
  });

  it("rejects an inactive addon", () => {
    expect(() =>
      priceBooking({
        trekId: TREK, basePrice: 100000, adults: 1, children: 0,
        addons: [{ addon_id: "a1", quantity: 1 }],
        addonCatalog: [{ id: "a1", price: 5000, active: false, trek_id: TREK }],
      }),
    ).toThrow(/invalid addon/);
  });

  it("rejects non-positive addon quantity", () => {
    expect(() =>
      priceBooking({
        trekId: TREK, basePrice: 100000, adults: 1, children: 0,
        addons: [{ addon_id: "a1", quantity: 0 }],
        addonCatalog: [{ id: "a1", price: 5000, active: true, trek_id: TREK }],
      }),
    ).toThrow(/invalid addon quantity/);
  });

  it("priceBooking adds boarding price per traveller", () => {
    const base = priceBooking({ trekId: TREK, basePrice: 100000, adults: 2, children: 1 });
    const p = priceBooking({ trekId: TREK, basePrice: 100000, adults: 2, children: 1, boardingPrice: 80000 });
    expect(p.boardingTotal).toBe(240000); // 80000 x (2 adults + 1 child)
    expect(p.grandTotal).toBe(base.grandTotal + 240000);
    expect(p.subtotal).toBe(base.subtotal + 240000);
  });

  it("boardingPrice null/0/undefined -> no change", () => {
    const base = priceBooking({ trekId: TREK, basePrice: 100000, adults: 2, children: 1 });
    expect(base.boardingTotal).toBe(0);
    for (const boardingPrice of [null, 0, undefined]) {
      const p = priceBooking({ trekId: TREK, basePrice: 100000, adults: 2, children: 1, boardingPrice });
      expect(p.boardingTotal).toBe(0);
      expect(p.grandTotal).toBe(base.grandTotal);
    }
  });

  it("rejects a negative boarding price", () => {
    expect(() => priceBooking({ trekId: TREK, basePrice: 100000, adults: 1, children: 0, boardingPrice: -1 })).toThrow(
      /invalid boarding/,
    );
  });

  it("requires at least one adult", () => {
    expect(() => priceBooking({ trekId: TREK, basePrice: 100000, adults: 0, children: 1 })).toThrow(
      /at least one adult/,
    );
  });
});

describe("computeDeposit", () => {
  it("percent: rounds share of total", () => {
    expect(computeDeposit(1000000, { type: "percent", value: 30 })).toBe(300000);
    expect(computeDeposit(333, { type: "percent", value: 50 })).toBe(167);
  });
  it("flat: capped at total", () => {
    expect(computeDeposit(1000000, { type: "flat", value: 500000 })).toBe(500000);
    expect(computeDeposit(300000, { type: "flat", value: 500000 })).toBe(300000);
  });
  it("none -> full payment", () => {
    expect(computeDeposit(1000000, { type: "none", value: 0 })).toBe(1000000);
  });
  it("percent 0 -> full; never above total or below 0", () => {
    expect(computeDeposit(1000000, { type: "percent", value: 0 })).toBe(1000000);
    expect(computeDeposit(1000000, { type: "percent", value: 150 })).toBe(1000000);
    expect(computeDeposit(1000000, { type: "flat", value: -5 })).toBe(0);
  });
});

describe("resolveCharge (what the gateway actually charges)", () => {
  it("deposit mode on a trek that allows it -> the deposit slice", () => {
    expect(resolveCharge(1000000, "deposit", { type: "percent", value: 30 })).toEqual({ amount: 300000, kind: "deposit" });
    expect(resolveCharge(1000000, "deposit", { type: "flat", value: 250000 })).toEqual({ amount: 250000, kind: "deposit" });
  });
  it("full mode is always the whole total, even when deposits are configured", () => {
    expect(resolveCharge(1000000, "full", { type: "percent", value: 30 })).toEqual({ amount: 1000000, kind: "full" });
  });
  it("deposit falls back to full when the trek doesn't allow deposits", () => {
    expect(resolveCharge(1000000, "deposit", { type: "none", value: 0 })).toEqual({ amount: 1000000, kind: "full" });
  });
  it("no ₹0 or full-sized deposit: a deposit that isn't a real partial falls back to full", () => {
    // percent 0 / flat >= total compute to the full total -> never a 'deposit' charge
    expect(resolveCharge(1000000, "deposit", { type: "percent", value: 0 })).toEqual({ amount: 1000000, kind: "full" });
    expect(resolveCharge(1000000, "deposit", { type: "percent", value: 100 })).toEqual({ amount: 1000000, kind: "full" });
    expect(resolveCharge(1000000, "deposit", { type: "flat", value: 1000000 })).toEqual({ amount: 1000000, kind: "full" });
    expect(resolveCharge(1000000, "deposit", { type: "flat", value: 0 })).toEqual({ amount: 1000000, kind: "full" });
  });
});
