// Vitest suite for lead validation. Runner is wired in Phase 1 (`npx vitest`).
// Until then this documents the contract; the logic it guards is pure.
import { describe, it, expect } from "vitest";
import { validateLead } from "./lead";

describe("validateLead", () => {
  const good = { name: "Asha", email: "asha@example.com", message: "Hi" };

  it("accepts a valid lead and trims", () => {
    const r = validateLead({ ...good, name: "  Asha  " });
    expect(r.ok).toBe(true);
    if (r.ok && !r.bot) expect(r.value.name).toBe("Asha");
  });

  it("requires name, email, message", () => {
    expect(validateLead({ email: "a@b.co", message: "x" }).ok).toBe(false);
    expect(validateLead({ name: "A", message: "x" }).ok).toBe(false);
    expect(validateLead({ name: "A", email: "a@b.co" }).ok).toBe(false);
  });

  it("rejects bad email", () => {
    expect(validateLead({ ...good, email: "not-an-email" }).ok).toBe(false);
  });

  it("rejects over-long fields", () => {
    expect(validateLead({ ...good, message: "x".repeat(5001) }).ok).toBe(false);
  });

  it("treats a filled honeypot as a silent bot accept", () => {
    const r = validateLead({ ...good, company: "spam" });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.bot).toBe(true);
  });

  it("null-coalesces optional phone/subject", () => {
    const r = validateLead(good);
    if (r.ok && !r.bot) {
      expect(r.value.phone).toBeNull();
      expect(r.value.subject).toBeNull();
    }
  });
});
