import { describe, it, expect } from "vitest";
import { canTransition, assertTransition, isTerminal, BOOKING_STATUSES } from "./state";

describe("booking state machine", () => {
  it("allows the guest-first happy path", () => {
    expect(canTransition("draft", "pending_auth")).toBe(true);
    expect(canTransition("pending_auth", "pending_payment")).toBe(true);
    expect(canTransition("pending_payment", "payment_processing")).toBe(true);
    expect(canTransition("payment_processing", "confirmed")).toBe(true);
    expect(canTransition("confirmed", "completed")).toBe(true);
  });

  it("allows failure/cancel/expire branches", () => {
    expect(canTransition("payment_processing", "payment_failed")).toBe(true);
    expect(canTransition("payment_failed", "pending_payment")).toBe(true); // retry
    expect(canTransition("pending_payment", "expired")).toBe(true);
    expect(canTransition("pending_auth", "draft")).toBe(true); // change email
  });

  it("rejects skipping payment (draft cannot jump to confirmed)", () => {
    expect(canTransition("draft", "confirmed")).toBe(false);
    expect(canTransition("draft", "pending_payment")).toBe(false);
    expect(canTransition("pending_auth", "confirmed")).toBe(false);
  });

  it("rejects moving out of terminal states", () => {
    for (const t of ["cancelled", "expired", "completed"] as const) {
      expect(isTerminal(t)).toBe(true);
      expect(canTransition(t, "draft")).toBe(false);
      expect(canTransition(t, "confirmed")).toBe(false);
    }
  });

  it("treats same-state as a no-op", () => {
    expect(canTransition("pending_payment", "pending_payment")).toBe(true);
  });

  it("assertTransition throws on invalid", () => {
    expect(() => assertTransition("draft", "completed")).toThrow(/invalid booking transition/);
    expect(() => assertTransition("draft", "pending_auth")).not.toThrow();
  });

  it("every status has a transition entry", () => {
    for (const s of BOOKING_STATUSES) {
      expect(canTransition(s, s)).toBe(true);
    }
  });
});
