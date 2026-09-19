// Booking state machine — mirrors enforce_booking_transition() in
// supabase/migrations/0006_booking_engine.sql. The DB trigger is the ultimate
// authority; this is the app-layer copy used for guards, UI, and unit tests.

export const BOOKING_STATUSES = [
  "draft",
  "pending_auth",
  "pending_payment",
  "payment_processing",
  "confirmed",
  "payment_failed",
  "cancelled",
  "expired",
  "completed",
  "deposit_paid",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

// Allowed forward transitions (must match the SQL trigger exactly).
export const BOOKING_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  draft: ["pending_auth", "cancelled", "expired"],
  pending_auth: ["pending_payment", "draft", "cancelled", "expired"],
  pending_payment: ["payment_processing", "cancelled", "expired"],
  payment_processing: ["confirmed", "payment_failed"],
  payment_failed: ["pending_payment", "cancelled"],
  deposit_paid: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  cancelled: [],
  expired: [],
  completed: [],
};

export const TERMINAL_STATUSES: readonly BookingStatus[] = ["cancelled", "expired", "completed"];

export function isTerminal(status: BookingStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  if (from === to) return true; // idempotent no-op, matches the trigger
  return BOOKING_TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: BookingStatus, to: BookingStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`invalid booking transition ${from} -> ${to}`);
  }
}
