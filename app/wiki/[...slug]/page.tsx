import { notFound, redirect } from "next/navigation";
import { getPage } from "@/lib/content";
import { getRole } from "@/lib/session";

export default async function WikiPage({ params }: PageProps<"/wiki/[...slug]">) {
  const role = await getRole();
  if (!role) redirect("/login");

  const { slug } = await params;
  // Hidden pages 404 for players rather than revealing that they exist.
  const page = await getPage(role, slug.map(decodeURIComponent).join("/"));
  if (!page) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold">
        {page.meta.title}
        {page.meta.visibility === "gm" && <span className="gm-badge">GM</span>}
      </h1>
      <article className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
    </main>
  );
}
