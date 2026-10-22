import { notFound } from "next/navigation";
import Link from "next/link";
import { publicClient } from "@/lib/seo";

export const revalidate = 300;
export async function generateStaticParams() {
  return [];
}

async function getPost(slug) {
  const supabase = publicClient();
  const { data } = await supabase
    .from("posts")
    .select("slug,title,excerpt,body,published_at")
    .eq("slug", slug)
    .eq("status", "published")
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function generateMetadata(props) {
  const params = await props.params;
  const post = await getPost(params.slug);
  return { title: post ? post.title : "Story" };
}

export default async function BlogPostPage(props) {
  const params = await props.params;
  const post = await getPost(params.slug);
  if (!post) return notFound();

  return (
    <>
      <section className="relative bg-dark text-white">
        <div className="absolute inset-0 bg-hero-pattern" />
        <div className="container-px relative py-16">
          <nav className="mb-3 text-sm text-white/70">
            <Link href="/" className="hover:text-white">Home</Link>
            <span className="mx-2">/</span>
            <span className="text-white">Stories</span>
          </nav>
          {post.published_at && (
            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-accent">
              {new Date(post.published_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </span>
          )}
          <h1 className="max-w-3xl text-3xl font-bold sm:text-4xl">{post.title}</h1>
          {post.excerpt && <p className="mt-3 max-w-2xl text-white/80">{post.excerpt}</p>}
        </div>
      </section>

      <article className="container-px py-14">
        <div className="max-w-3xl">
          {post.body && <p className="whitespace-pre-line text-lg leading-relaxed text-gray-600">{post.body}</p>}
          <Link href="/treks" className="btn-primary mt-10 inline-flex">
            Explore our treks
          </Link>
        </div>
      </article>
    </>
  );
}
