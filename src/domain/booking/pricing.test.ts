import { describe, it, expect } from "vitest";
import { priceBooking } from "./pricing";

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

  it("requires at least one adult", () => {
    expect(() => priceBooking({ trekId: TREK, basePrice: 100000, adults: 0, children: 1 })).toThrow(
      /at least one adult/,
    );
  });
});
