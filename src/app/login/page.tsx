import { Suspense } from "react";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <section className="section">
      <div className="container-px" style={{ maxWidth: 480, margin: "0 auto", padding: "48px 16px" }}>
        <h1 className="section-title" style={{ textAlign: "center", marginBottom: 8 }}>Sign in</h1>
        <p style={{ textAlign: "center", marginBottom: 24, color: "#6b7280" }}>
          No password needed — we&apos;ll email you a one-time code.
        </p>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </section>
  );
}
