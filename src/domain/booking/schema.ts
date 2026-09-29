import { z } from "zod";

// Validation for the booking flow (zod at the trust boundary — see
// docs/V2_DECISIONS.md). Amounts are NEVER accepted from the client; the server
// prices via price_booking(). Only structural/contact inputs are validated here.

export const genderEnum = z.enum(["male", "female", "other", "prefer_not_to_say"]);

export const travellerSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required.").max(120),
  age: z.number().int().min(1).max(120).nullable().optional(),
  gender: genderEnum.nullable().optional(),
  phone: z.string().trim().max(40).optional().or(z.literal("")).transform((v) => v || null),
  email: z.string().trim().max(200).optional().or(z.literal("")).transform((v) => v || null),
  emergency_contact_phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || null),
  is_lead: z.boolean().default(false),
});

export const addonSelectionSchema = z.object({
  addon_id: z.string().uuid(),
  quantity: z.number().int().positive(),
});

export const createDraftSchema = z
  .object({
    trek_id: z.string().uuid(),
    departure_id: z.string().uuid(),
    adults: z.number().int().min(1, "At least one adult.").max(20),
    children: z.number().int().min(0).max(20),
    contact_name: z.string().trim().min(1).max(120),
    contact_phone: z.string().trim().max(40).optional().or(z.literal("")).transform((v) => v || null),
    travellers: z.array(travellerSchema).max(40).default([]),
    addons: z.array(addonSelectionSchema).max(20).default([]),
  })
  .refine((v) => v.adults + v.children >= 1, { message: "At least one traveller." });

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .max(200)
  .email("Enter a valid email address.");

// Supabase OTP length (GOTRUE_MAILER_OTP_LENGTH) is currently 8; keep in sync
// with CODE_LEN in BookingFlow.
export const otpSchema = z.string().trim().regex(/^\d{8}$/, "Enter the 8-digit code.");

// Password policy: 8+ chars, one uppercase, one digit, one special.
export const passwordSchema = z
  .string()
  .min(8, "Use at least 8 characters.")
  .regex(/[A-Z]/, "Add an uppercase letter.")
  .regex(/\d/, "Add a number.")
  .regex(/[^A-Za-z0-9]/, "Add a special character.");

export const nameSchema = z.string().trim().min(2, "Enter your name.").max(80);

// True when the password does NOT embed the user's identity (a name token of
// length >= 3, or the email local-part). Case-insensitive substring check.
export function passwordDisallowsIdentity(pw: string, id: { name?: string; email?: string }): boolean {
  const lower = pw.toLowerCase();
  const tokens: string[] = [];
  if (id.name) tokens.push(...id.name.toLowerCase().split(/\s+/));
  if (id.email) tokens.push(id.email.toLowerCase().split("@")[0] ?? "");
  return !tokens.some((t) => t.length >= 3 && lower.includes(t));
}

export type CreateDraftInput = z.infer<typeof createDraftSchema>;
export type TravellerInput = z.infer<typeof travellerSchema>;
