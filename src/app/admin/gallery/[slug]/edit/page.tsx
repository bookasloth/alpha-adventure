import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/admin/data";
import AlbumForm from "../../AlbumForm";

export const metadata = { title: "Edit album", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditAlbumPage({ params }: { params: { slug: string } }) {
  const { admin } = await requireAdmin();
  const { data: a } = await admin
    .from("gallery_albums")
    .select("slug,title,subtitle,hero,hero_alt,status")
    .eq("slug", params.slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!a) notFound();
  const initial = {
    slug: a.slug, title: a.title ?? "", subtitle: a.subtitle ?? "",
    hero: a.hero ?? "", hero_alt: a.hero_alt ?? "", status: a.status ?? "draft",
  };
  return <div className="min-h-screen bg-page text-ink"><AlbumForm mode="edit" initial={initial} /></div>;
}
