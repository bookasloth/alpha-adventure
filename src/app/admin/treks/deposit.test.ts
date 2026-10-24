import { describe, it, expect } from "vitest";
import { z } from "zod";
import { depositFields, refineDeposit } from "./deposit";

const schema = z.object(depositFields).superRefine(refineDeposit);

describe("deposit schema", () => {
  it("rejects flat with value 0", () => {
    const r = schema.safeParse({ deposit_type: "flat", deposit_value: 0 });
    expect(r.success).toBe(false);
    if (!r.success) expect(r.error.issues[0].path).toEqual(["deposit_value"]);
  });
  it("accepts a positive flat value", () => {
    expect(schema.safeParse({ deposit_type: "flat", deposit_value: 5000 }).success).toBe(true);
  });
  it("percent must be 1-100; none ignores value", () => {
    expect(schema.safeParse({ deposit_type: "percent", deposit_value: 0 }).success).toBe(false);
    expect(schema.safeParse({ deposit_type: "percent", deposit_value: 30 }).success).toBe(true);
    expect(schema.safeParse({ deposit_type: "none", deposit_value: 0 }).success).toBe(true);
  });
});
