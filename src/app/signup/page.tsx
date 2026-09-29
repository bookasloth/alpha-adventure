import { Suspense } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "../login/LoginForm";

export const metadata = { title: "Create account" };

export default function SignupPage() {
  return (
    <AuthLayout
      topRight={
        <>
          <Link href="/login" className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">Already a member? Sign in</Link>
          <Link href="/treks/upcoming-treks" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-ink">Find a Trek</Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm mode="register" sub="Create your account with an email and password." />
      </Suspense>
    </AuthLayout>
  );
}
