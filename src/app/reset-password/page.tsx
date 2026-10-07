import { Suspense } from "react";
import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import ResetForm from "./ResetForm";

export const metadata = { title: "Reset password", robots: { index: false, follow: false } };

export default function ResetPasswordPage() {
  return (
    <AuthLayout
      topRight={<Link href="/login" className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">Back to sign in</Link>}
    >
      <p className="mb-6 text-lg font-bold text-ink">Choose a new password</p>
      <Suspense fallback={null}><ResetForm /></Suspense>
    </AuthLayout>
  );
}
