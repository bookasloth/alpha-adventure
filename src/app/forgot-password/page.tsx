import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import ForgotForm from "./ForgotForm";

export const metadata = { title: "Trouble signing in", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      topRight={<Link href="/login" className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">Back to sign in</Link>}
    >
      <p className="mb-6 text-lg font-bold text-ink">Reset your password</p>
      <ForgotForm />
    </AuthLayout>
  );
}
