"use client";
import { useEffect } from "react";

// Binds the legacy (Pattern B) contact form to POST /api/leads so enquiries are
// persisted instead of discarded. ponytail: client-fetch bridge because the form
// is injected HTML, not a React form; rebuild as Pattern A + Server Action later.
export default function ContactFormScripts() {
  useEffect(() => {
    const form = document.getElementById("contactForm");
    if (!form) return;

    const status = document.getElementById("contactFormStatus");
    status?.setAttribute("aria-live", "polite");
    let sending = false;
    const setStatus = (msg, ok) => {
      if (!status) return;
      status.textContent = msg;
      status.style.color = ok ? "#16a34a" : "#dc2626";
    };

    const onSubmit = async (e) => {
      e.preventDefault();
      if (sending) return; // Enter-key resubmits while a request is in flight
      // The markup has `novalidate`; run the browser's own required/email
      // checks so obvious mistakes are caught instantly, not after a round trip.
      if (!form.reportValidity()) return;
      const btn = form.querySelector('button[type="submit"]');
      const fd = new FormData(form);
      const payload = {
        name: fd.get("name"),
        email: fd.get("email"),
        phone: fd.get("phone"),
        subject: fd.get("subject"),
        message: fd.get("message"),
        company: fd.get("company"), // honeypot
      };

      setStatus("Sending…", true);
      sending = true;
      if (btn) { btn.disabled = true; btn.setAttribute("aria-busy", "true"); }
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(15000), // never leave the button stuck on "Sending…"
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.ok) {
          setStatus("Thanks! We've received your message and will get back to you soon.", true);
          form.reset();
        } else {
          setStatus(data?.error?.message || "Something went wrong. Please try again.", false);
        }
      } catch {
        setStatus("Network error. Please try again or WhatsApp us.", false);
      } finally {
        sending = false;
        if (btn) { btn.disabled = false; btn.removeAttribute("aria-busy"); }
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  return null;
}
