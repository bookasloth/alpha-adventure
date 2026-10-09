import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "./LoginForm";

export const metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default async function LoginPage(props: { searchParams: Promise<{ next?: string | string[] }> }) {
  const { next } = await props.searchParams;
  return (
    <AuthLayout
      topRight={
        <>
          <Link href="/signup" className="rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">Not a member? Register</Link>
          <Link href="/treks" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-ink">Find a Trek</Link>
        </>
      }
    >
      <LoginForm nextParam={typeof next === "string" ? next : undefined} />
    </AuthLayout>
  );
}
