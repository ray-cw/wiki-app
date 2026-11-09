import Link from "next/link";
import { redirect } from "next/navigation";
import { listPages } from "@/lib/content";
import { getRole } from "@/lib/session";

export default async function Home() {
  const role = await getRole();
  if (!role) redirect("/login");
  const pages = await listPages(role);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-semibold">Pages</h1>
      {pages.length === 0 ? (
        <p>No pages yet. Is the content folder fetched?</p>
      ) : (
        <ul className="space-y-2">
          {pages.map((page) => (
            <li key={page.slug}>
              <Link href={`/wiki/${page.slug}`} className="underline">
                {page.title}
              </Link>
              {page.visibility === "gm" && <span className="gm-badge">GM</span>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
