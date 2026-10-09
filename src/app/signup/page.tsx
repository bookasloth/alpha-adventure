import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "../login/LoginForm";

export const metadata = { title: "Create account", robots: { index: false, follow: false } };

export default async function SignupPage(props: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await props.searchParams;
  return (
    <AuthLayout
      topRight={
        <>
          <Link href="/login" className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">Already a member? Sign in</Link>
          <Link href="/treks" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-ink">Find a Trek</Link>
        </>
      }
    >
      <LoginForm nextParam={typeof next === "string" ? next : undefined} mode="register" sub="Create your account with an email and password." />
    </AuthLayout>
  );
}
