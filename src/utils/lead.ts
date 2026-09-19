// Pure validation for contact/enquiry leads. No framework deps so it is trivial
// to unit-test. ponytail: hand-rolled now; swap to a zod schema in Phase 1 when
// zod + shared schemas land (see docs/V2_DECISIONS.md).

export type LeadInput = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  subject?: unknown;
  message?: unknown;
  company?: unknown; // honeypot
};

export type LeadRow = {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  source: string;
};

export type ValidateResult =
  | { ok: true; bot: false; value: LeadRow }
  | { ok: true; bot: true } // honeypot tripped — accept silently, don't store
  | { ok: false; error: string };

const MAX = { name: 120, email: 200, phone: 40, subject: 160, message: 5000 };
const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function validateLead(
  input: LeadInput,
  source = "contact"
): ValidateResult {
  // Honeypot: real users never see/fill `company`. Bots do.
  if (str(input.company)) return { ok: true, bot: true };

  const name = str(input.name);
  const email = str(input.email);
  const phone = str(input.phone);
  const subject = str(input.subject);
  const message = str(input.message);

  if (!name || !email || !message)
    return { ok: false, error: "Name, email and message are required." };
  if (!isEmail(email))
    return { ok: false, error: "Enter a valid email address." };
  if (
    name.length > MAX.name ||
    email.length > MAX.email ||
    phone.length > MAX.phone ||
    subject.length > MAX.subject ||
    message.length > MAX.message
  )
    return { ok: false, error: "One or more fields are too long." };

  return {
    ok: true,
    bot: false,
    value: {
      name,
      email,
      phone: phone || null,
      subject: subject || null,
      message,
      source,
    },
  };
}
