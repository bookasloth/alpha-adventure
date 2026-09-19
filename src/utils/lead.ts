import { z } from "zod";

// Lead validation via a shared zod schema (see docs/V2_DECISIONS.md: zod at
// every trust boundary). Pure — no framework deps, so it is trivial to unit-test.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Optional free-text field: trims, caps length, normalises "" / undefined -> null.
const optText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, "One or more fields are too long.")
    .optional()
    .transform((v) => (v && v.length ? v : null));

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name is too long."),
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .max(200, "Email is too long.")
    .regex(EMAIL, "Enter a valid email address."),
  phone: optText(40),
  subject: optText(160),
  message: z.string().trim().min(1, "Message is required.").max(5000, "Message is too long."),
  source: z.string().default("contact"),
});

export type LeadRow = z.infer<typeof leadSchema>;

export type LeadInput = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown; // honeypot
};

export type ValidateResult =
  | { ok: true; bot: false; value: LeadRow }
  | { ok: true; bot: true } // honeypot tripped — accept silently, don't store
  | { ok: false; error: string };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function validateLead(input: LeadInput, source = "contact"): ValidateResult {
  // Honeypot: real users never see/fill `company`. Bots do.
  if (str(input.company)) return { ok: true, bot: true };

  const parsed = leadSchema.safeParse({
    name: input.name,
    email: input.email,
    phone: input.phone,
    subject: input.subject,
    message: input.message,
    source,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }
  return { ok: true, bot: false, value: parsed.data };
}
