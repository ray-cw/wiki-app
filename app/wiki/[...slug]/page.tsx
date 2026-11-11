import type { Metadata } from "next";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { getPage } from "@/lib/content";
import { getRole } from "@/lib/session";
import { GmBadge } from "../../gm-badge";
import { guildColorVars } from "../../guild-colors";
import { GuildDisc } from "../../guild-wheel";
import { Infobox } from "./infobox";

// Share the authorized lookup between metadata and the page for this request.
const loadWikiPage = cache(async (slug: string) => {
  const role = await getRole();
  if (!role) redirect("/login");

  // Hidden pages 404 for players rather than revealing that they exist.
  const page = await getPage(role, slug);
  if (!page) notFound();
  return page;
});

export async function generateMetadata({ params }: PageProps<"/wiki/[...slug]">): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadWikiPage(slug.map(decodeURIComponent).join("/"));
  return { title: page.meta.title };
}

export default async function WikiPage({ params }: PageProps<"/wiki/[...slug]">) {
  const { slug } = await params;
  const page = await loadWikiPage(slug.map(decodeURIComponent).join("/"));

  const { infobox } = page.meta;
  return (
    // A little wider when an infobox shares the row with the text.
    <main className={`mx-auto w-full px-4 py-8 ${infobox ? "max-w-4xl" : "max-w-3xl"}`}>
      <header className="mb-6 flex items-center gap-6">
        {page.meta.icon && (
          <span className={`group relative flex-none ${page.meta.subtitle ? "size-16" : "size-14"}`} style={guildColorVars(page.meta.colors)}>
            <GuildDisc icon={page.meta.icon} lit={Boolean(page.meta.colors)} />
          </span>
        )}
        <div className="min-w-0">
          <h1 className="text-3xl leading-tight">
            {page.meta.title}
            {page.meta.visibility === "gm" && <GmBadge />}
          </h1>
          {page.meta.subtitle && (
            <p className="font-heading text-lg leading-tight text-muted">{page.meta.subtitle}</p>
          )}
        </div>
      </header>
      <div className="flow-root">
        {infobox && (
          <Infobox title={page.meta.title} infobox={infobox} style={guildColorVars(page.meta.colors)} />
        )}
        <article className="prose" dangerouslySetInnerHTML={{ __html: page.html }} />
      </div>
    </main>
  );
}
