import { describe, it, expect } from "vitest";
import { safeNext } from "./safeNext";

describe("safeNext", () => {
  it("keeps a same-origin relative path", () => {
    expect(safeNext("/account")).toBe("/account");
  });
  it("rejects protocol-relative //host", () => {
    expect(safeNext("//evil.com")).toBe("/user-dashboard");
  });
  it("rejects backslash open-redirect /\\host", () => {
    expect(safeNext("/\\evil.com")).toBe("/user-dashboard");
  });
  it("rejects absolute URLs", () => {
    expect(safeNext("https://evil.com")).toBe("/user-dashboard");
  });
  it("rejects control characters", () => {
    expect(safeNext("/foo\nbar")).toBe("/user-dashboard");
  });
  it("falls back for non-strings", () => {
    expect(safeNext(undefined)).toBe("/user-dashboard");
    expect(safeNext(42)).toBe("/user-dashboard");
  });
});
