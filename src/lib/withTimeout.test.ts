import { describe, it, expect } from "vitest";
import { withTimeout } from "./withTimeout";

describe("withTimeout", () => {
  it("resolves with the value when in time", async () => {
    await expect(withTimeout(Promise.resolve(7), 1000)).resolves.toBe(7);
  });
  it("rejects when the promise stalls past the deadline", async () => {
    await expect(withTimeout(new Promise(() => {}), 10)).rejects.toThrow("timeout");
  });
});
