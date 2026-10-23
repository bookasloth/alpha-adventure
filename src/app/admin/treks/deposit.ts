import { z } from "zod";

// Deposit / split-payment config (migration 0030), shared by createTrek + updateTrek.
// Input units from the form: percent => whole number 1-100; flat => RUPEES (converted to paise on save).
// Stored units: deposit_value is a plain integer for percent, PAISE for flat.
export const depositFields = {
  deposit_type: z.enum(["none", "percent", "flat"]).default("none"),
  deposit_value: z.coerce.number().min(0).max(10_000_000).default(0),
  balance_due_offset_days: z.coerce.number().int("Balance due days must be a whole number").min(0).max(60, "Balance due days must be 0-60").default(2),
};

type DepositIn = { deposit_type: "none" | "percent" | "flat"; deposit_value: number };

// For schema.superRefine: percent must be a whole number 1-100.
export function refineDeposit(t: DepositIn, ctx: z.RefinementCtx) {
  if (t.deposit_type === "percent" && (!Number.isInteger(t.deposit_value) || t.deposit_value < 1 || t.deposit_value > 100)) {
    ctx.addIssue({ code: "custom", path: ["deposit_value"], message: "Deposit percentage must be a whole number from 1 to 100" });
  }
  // flat 0 would charge nothing up front (opposite of percent-0 = full), so require a positive amount.
  if (t.deposit_type === "flat" && !(t.deposit_value > 0)) {
    ctx.addIssue({ code: "custom", path: ["deposit_value"], message: "Flat deposit amount must be greater than 0" });
  }
}

// DB columns for the treks insert/update. type 'none' stores value 0.
export function depositColumns(t: DepositIn & { balance_due_offset_days: number }) {
  return {
    deposit_type: t.deposit_type,
    deposit_value: t.deposit_type === "percent" ? t.deposit_value : t.deposit_type === "flat" ? Math.round(t.deposit_value * 100) : 0,
    balance_due_offset_days: t.balance_due_offset_days,
  };
}
