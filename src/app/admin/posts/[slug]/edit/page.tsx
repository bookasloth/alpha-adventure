import { notFound } from "next/navigation";
import { requireAdmin } from "@/app/admin/data";
import PostForm from "../../PostForm";

export const metadata = { title: "Edit post", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function EditPostPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { admin } = await requireAdmin();
  const { data: p } = await admin
    .from("posts")
    .select("slug,title,excerpt,body,status,trek_id,seo_title,meta_description")
    .eq("slug", params.slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!p) notFound();

  const { data: treks } = await admin
    .from("treks").select("id,title").is("deleted_at", null).order("title");
  const trekOptions = (treks ?? []).map((t) => ({ id: t.id, title: t.title }));

  const initial = {
    slug: p.slug,
    title: p.title ?? "",
    excerpt: p.excerpt ?? "",
    body: p.body ?? "",
    status: p.status ?? "draft",
    trek_id: p.trek_id ?? "",
    seo_title: p.seo_title ?? "",
    meta_description: p.meta_description ?? "",
  };
  return (
    <div className="min-h-screen bg-page text-ink">
      <PostForm mode="edit" initial={initial} trekOptions={trekOptions} />
    </div>
  );
}
