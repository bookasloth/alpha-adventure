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
    const setStatus = (msg, ok) => {
      if (!status) return;
      status.textContent = msg;
      status.style.color = ok ? "#16a34a" : "#dc2626";
    };

    const onSubmit = async (e) => {
      e.preventDefault();
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
      if (btn) btn.disabled = true;
      try {
        const res = await fetch("/api/leads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
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
        if (btn) btn.disabled = false;
      }
    };

    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, []);

  return null;
}
