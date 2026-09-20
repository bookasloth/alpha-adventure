import { Suspense } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthLayout
      topRight={
        <>
          <Link href="/signup" className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">Not a member? Register</Link>
          <Link href="/treks/upcoming-treks" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-ink">Find a Trek</Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthLayout>
  );
}
