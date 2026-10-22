import { describe, expect, it, beforeAll } from "vitest";
import { createHash } from "crypto";

const USER = "alpha_cb_user";
const PASS = "alpha_cb_pass_123";
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

// verifyCallbackAuth reads the webhook creds from env at module load, so set
// them before importing the module under test.
let verifyCallbackAuth: (h: string | null) => boolean;
beforeAll(async () => {
  process.env.PHONEPE_WEBHOOK_USERNAME = USER;
  process.env.PHONEPE_WEBHOOK_PASSWORD = PASS;
  ({ verifyCallbackAuth } = await import("./phonepe"));
});

describe("PhonePe webhook Authorization (SHA256(username:password))", () => {
  it("accepts the genuine hash", () => {
    expect(verifyCallbackAuth(sha256(`${USER}:${PASS}`))).toBe(true);
  });
  it("accepts a header that carries a scheme prefix before the hash", () => {
    expect(verifyCallbackAuth(`SHA256 ${sha256(`${USER}:${PASS}`)}`)).toBe(true);
  });
  it("rejects a hash made from the wrong credentials", () => {
    expect(verifyCallbackAuth(sha256(`${USER}:wrong`))).toBe(false);
    expect(verifyCallbackAuth(sha256(`attacker:${PASS}`))).toBe(false);
  });
  it("rejects a truncated or empty header", () => {
    expect(verifyCallbackAuth(sha256(`${USER}:${PASS}`).slice(0, 20))).toBe(false);
    expect(verifyCallbackAuth("")).toBe(false);
    expect(verifyCallbackAuth(null)).toBe(false);
  });
});
