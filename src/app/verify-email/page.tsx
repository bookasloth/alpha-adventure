import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import { verifyVerifyToken } from "@/lib/verifyEmail";
import { createAdminClient } from "@/utils/supabase/admin";

export const metadata = { title: "Email verified" };
export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({ searchParams }: { searchParams: { token?: string } }) {
  const userId = verifyVerifyToken(searchParams.token);
  let ok = false;
  if (userId) {
    const admin = createAdminClient();
    const { error } = await admin.from("profiles").update({ email_verified: true }).eq("id", userId);
    ok = !error;
  }
  return (
    <AuthLayout>
      <p className="mb-4 text-lg font-bold text-ink">{ok ? "Email confirmed ✓" : "Link invalid or expired"}</p>
      <p className="text-sm text-gray-500">
        {ok ? "Thanks — your email is verified." : "This confirmation link didn't work. You can still use your account."}
      </p>
      <div className="mt-6">
        <Link href="/user-dashboard" className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-ink">Go to dashboard</Link>
      </div>
    </AuthLayout>
  );
}
