import { Suspense } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "../login/LoginForm";

export const metadata = { title: "Trouble signing in" };

// No passwords in this app (passwordless OTP) — "forgot password" is really
// just: send a fresh one-time sign-in code.
export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      topRight={
        <Link href="/login" className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">Back to sign in</Link>
      }
    >
      <Suspense fallback={null}>
        <LoginForm
          heading="Trouble signing in?"
          sub="Alpha Adventures is passwordless. Enter your email and we'll send a fresh one-time sign-in code."
          cta="Send sign-in code"
        />
      </Suspense>
    </AuthLayout>
  );
}
