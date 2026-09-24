import AdminShell from "./AdminShell";
import { getAdminData } from "./data";

// Admin dashboard. Server-fetched, admin/staff-gated (see data.ts). Full-screen, noindex.
export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getAdminData(); // redirects if not admin/staff
  return <AdminShell data={data} />;
}
