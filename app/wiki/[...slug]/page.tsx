import { notFound, redirect } from "next/navigation";
import { getPage } from "@/lib/content";
import { getRole } from "@/lib/session";
import { GmBadge } from "../../gm-badge";
import { guildColorVars } from "../../guild-colors";
import { GuildDisc } from "../../guild-wheel";
import { Infobox } from "./infobox";

export default async function WikiPage({ params }: PageProps<"/wiki/[...slug]">) {
  const role = await getRole();
  if (!role) redirect("/login");

  const { slug } = await params;
  // Hidden pages 404 for players rather than revealing that they exist.
  const page = await getPage(role, slug.map(decodeURIComponent).join("/"));
  if (!page) notFound();

  const { infobox } = page.meta;
  return (
    // A little wider when an infobox shares the row with the text.
    <main className={`mx-auto w-full px-4 py-8 ${infobox ? "max-w-4xl" : "max-w-3xl"}`}>
      <h1 className="mb-6 flex items-center gap-5 text-3xl">
        {page.meta.icon && (
          <span className="group relative size-14 flex-none" style={guildColorVars(page.meta.colors)}>
            <GuildDisc icon={page.meta.icon} lit={Boolean(page.meta.colors)} />
          </span>
        )}
        <span>
          {page.meta.title}
          {page.meta.visibility === "gm" && <GmBadge />}
        </span>
      </h1>
      <div className="flow-root">
        {infobox && (
          <Infobox title={page.meta.title} infobox={infobox} style={guildColorVars(page.meta.colors)} />
        )}
        <article className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
      </div>
    </main>
  );
}
