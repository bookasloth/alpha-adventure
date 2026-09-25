import { requireAdmin } from "@/app/admin/data";
import AlbumForm from "../AlbumForm";

export const metadata = { title: "Add album", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewAlbumPage() {
  await requireAdmin();
  return <div className="min-h-screen bg-page text-ink"><AlbumForm mode="new" /></div>;
}
