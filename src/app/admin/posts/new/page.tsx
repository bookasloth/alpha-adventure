import { requireAdmin } from "@/app/admin/data";
import PostForm from "../PostForm";

export const metadata = { title: "Add post", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function NewPostPage() {
  const { admin } = await requireAdmin(); // redirects if not admin/staff
  const { data: treks } = await admin
    .from("treks").select("id,title").is("deleted_at", null).order("title");
  const trekOptions = (treks ?? []).map((t) => ({ id: t.id, title: t.title }));
  return (
    <div className="min-h-screen bg-page text-ink">
      <PostForm mode="new" trekOptions={trekOptions} />
    </div>
  );
}
