import AdminShell from "./AdminShell";

// Admin UI mockup (not wired). Full-screen, noindex.
export const metadata = { title: "Admin", robots: { index: false, follow: false } };

export default function AdminPage() {
  return <AdminShell />;
}
