import { describe, it, expect } from "vitest";
import { sectionOf, canonicalPath, GROUP_ALIASES, GROUP_TO_SECTION } from "./sections";

describe("sectionOf", () => {
  it("maps trek groups to treks", () => {
    expect(sectionOf("sahyadri")).toBe("treks");
    expect(sectionOf("himalayan")).toBe("treks");
    expect(sectionOf("central")).toBe("treks");
  });
  it("maps leisure groups to their sections", () => {
    expect(sectionOf("backpacking")).toBe("backpacking-trips");
    expect(sectionOf("near-nagpur")).toBe("trips-near-nagpur");
  });
  it("returns null for null/unknown", () => {
    expect(sectionOf(null)).toBeNull();
    expect(sectionOf(undefined)).toBeNull();
    expect(sectionOf("bogus")).toBeNull();
  });
});

describe("canonicalPath", () => {
  it("builds /<section>/<slug>", () => {
    expect(canonicalPath({ group: "sahyadri", slug: "rajgad-fort-trek" })).toBe("/treks/rajgad-fort-trek");
    expect(canonicalPath({ group: "backpacking", slug: "spiti-valley" })).toBe("/backpacking-trips/spiti-valley");
    expect(canonicalPath({ group: "near-nagpur", slug: "silver-falls" })).toBe("/trips-near-nagpur/silver-falls");
  });
  it("falls back to /treks for unknown group", () => {
    expect(canonicalPath({ group: null, slug: "x" })).toBe("/treks/x");
    expect(canonicalPath({ group: "bogus", slug: "y" })).toBe("/treks/y");
  });
});

describe("GROUP_ALIASES", () => {
  it("every alias target is a real treks group", () => {
    for (const group of Object.values(GROUP_ALIASES)) {
      expect(GROUP_TO_SECTION[group]).toBe("treks");
    }
  });
});
