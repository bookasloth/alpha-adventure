import { describe, expect, it } from "vitest";
import { emailPreviews, bookingConfirmed, leadReply, adminEnquiryAlert, fmtDate, htmlToText } from "./emailTemplates";

const BASE = "https://alphaadventures.in";

describe("email templates", () => {
  it("renders every template with subject, html and a tag-free text part", () => {
    const all = emailPreviews(BASE);
    expect(all.length).toBe(16);
    for (const { key, r } of all) {
      expect(r.subject, key).toBeTruthy();
      expect(r.html, key).toContain("<!doctype html>");
      expect(r.html, key).toContain(`${BASE}/assets/img/logo/logo.png`);
      expect(r.text, key).not.toMatch(/<[a-z]/i);
      expect(r.text.length, key).toBeGreaterThan(40);
    }
  });

  it("escapes customer- and catalog-supplied text", () => {
    const evil = "<script>alert(1)</script>";
    const b = { to: "a@b.co", reference: "AA-1", trekTitle: evil, departureDate: "2026-11-14", seats: 1, total: 100 };
    expect(bookingConfirmed(BASE, b).html).not.toContain("<script>");
    expect(leadReply(BASE, evil, "Re: hi", `hello ${evil}`).html).not.toContain("<script>");
    expect(adminEnquiryAlert(BASE, { name: evil, email: "x@y.z", phone: null, subject: null, message: evil }).html).not.toContain("<script>");
  });

  it("formats plain dates without timezone drift", () => {
    expect(fmtDate("2026-11-14")).toBe("Sat 14 Nov 2026");
    expect(fmtDate(null)).toBe("");
  });

  it("keeps link targets in the text part", () => {
    expect(htmlToText(`<p>Go <a href="https://x.test/a?b=1&amp;c=2">here</a></p>`)).toBe("Go here (https://x.test/a?b=1&c=2)");
  });
});
