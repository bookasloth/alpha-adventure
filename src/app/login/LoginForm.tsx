"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendLoginOtp, verifyLoginOtp } from "./actions";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await sendLoginOtp(email);
    setBusy(false);
    if (r.ok) setStep("otp");
    else setError(r.error);
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const r = await verifyLoginOtp(email, code);
    setBusy(false);
    if (r.ok) router.replace(next);
    else setError(r.error);
  }

  return (
    <div style={{ maxWidth: 380, margin: "0 auto" }}>
      {step === "email" ? (
        <form onSubmit={submitEmail} className="flex flex-col gap-3">
          <label htmlFor="login-email" className="font-semibold">Your email</label>
          <input
            id="login-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="form-control"
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Sending…" : "Send code"}
          </button>
        </form>
      ) : (
        <form onSubmit={submitCode} className="flex flex-col gap-3">
          <p>We sent a 6-digit code to <strong>{email}</strong>.</p>
          <label htmlFor="login-otp" className="font-semibold">Enter code</label>
          <input
            id="login-otp"
            inputMode="numeric"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="form-control"
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? "Verifying…" : "Verify & sign in"}
          </button>
          <button
            type="button"
            className="text-sm underline"
            onClick={() => { setStep("email"); setCode(""); setError(null); }}
          >
            Change email
          </button>
        </form>
      )}
      {error && <p role="alert" style={{ color: "#dc2626", marginTop: 12 }}>{error}</p>}
    </div>
  );
}
