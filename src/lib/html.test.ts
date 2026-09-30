import { describe, it, expect } from "vitest";
import { escapeHtml } from "./html";

describe("escapeHtml", () => {
  it("neutralises a script tag", () => {
    expect(escapeHtml("<script>alert(1)</script>")).toBe(
      "&lt;script&gt;alert(1)&lt;/script&gt;",
    );
  });
  it("escapes quotes and ampersand", () => {
    expect(escapeHtml(`"Tom" & 'Jerry'`)).toBe("&quot;Tom&quot; &amp; &#39;Jerry&#39;");
  });
  it("leaves plain text untouched", () => {
    expect(escapeHtml("Har Ki Dun Trek")).toBe("Har Ki Dun Trek");
  });
});
