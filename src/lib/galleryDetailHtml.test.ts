import { describe, it, expect } from "vitest";
import { galleryDetailHtml } from "./galleryDetailHtml";

// Audit M1: DB-sourced album fields must be HTML-escaped before injection.
describe("galleryDetailHtml escaping", () => {
  const page = {
    slug: "x",
    title: `<img src=x onerror="alert(1)">`,
    hero: `"><script>alert(1)</script>`,
    heroAlt: `a" onmouseover="alert(1)`,
    seasons: [],
  };
  const html = galleryDetailHtml(page);

  it("does not emit the raw script/img breakout from the title", () => {
    expect(html).not.toContain("<img src=x onerror=");
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;img src=x onerror=");
  });

  it("escapes quotes in attribute context (hero/heroAlt)", () => {
    expect(html).not.toContain(`alt="a" onmouseover="alert(1)"`);
    expect(html).toContain("&quot;");
  });
});
