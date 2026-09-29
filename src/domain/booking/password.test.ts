import { describe, it, expect } from "vitest";
import { passwordSchema, passwordDisallowsIdentity } from "./schema";

describe("passwordSchema", () => {
  it("accepts a strong password", () => {
    expect(passwordSchema.safeParse("Trek@2026").success).toBe(true);
  });
  it("rejects too short", () => {
    expect(passwordSchema.safeParse("Aa@1").success).toBe(false);
  });
  it("rejects missing uppercase", () => {
    expect(passwordSchema.safeParse("trek@2026").success).toBe(false);
  });
  it("rejects missing digit", () => {
    expect(passwordSchema.safeParse("Trekking@x").success).toBe(false);
  });
  it("rejects missing special", () => {
    expect(passwordSchema.safeParse("Trekking2026").success).toBe(false);
  });
});

describe("passwordDisallowsIdentity", () => {
  it("rejects password containing the name", () => {
    expect(passwordDisallowsIdentity("Alpha@123", { name: "Alpha Singh" })).toBe(false);
  });
  it("rejects password containing the email local-part", () => {
    expect(passwordDisallowsIdentity("Rahul@2026", { email: "rahul@example.com" })).toBe(false);
  });
  it("ignores name tokens shorter than 3 chars", () => {
    expect(passwordDisallowsIdentity("Xy@201234", { name: "Xy Bo" })).toBe(true);
  });
  it("accepts a clean password", () => {
    expect(passwordDisallowsIdentity("Trek@2026", { name: "Alpha", email: "alpha@x.com" })).toBe(true);
  });
});
