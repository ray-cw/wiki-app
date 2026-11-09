import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";
import type { Role } from "./session";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

// Inline GM-only sections:
//   :::gm
//   The innkeeper is secretly a dragon.
//   :::
const GM_BLOCK = /^:::gm[ \t]*\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm;

export type PageMeta = {
  slug: string;
  title: string;
  visibility: Role;
};

function canSee(role: Role, visibility: Role) {
  return role === "gm" || visibility === "player";
}

async function walk(dir: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = await Promise.all(
    entries.map((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return walk(full);
      return entry.name.endsWith(".md") ? [full] : [];
    }),
  );
  return files.flat();
}

async function loadAll() {
  const files = await walk(PAGES_DIR);
  return Promise.all(
    files.map(async (file) => {
      const { data, content } = matter(await readFile(file, "utf8"));
      const slug = path
        .relative(PAGES_DIR, file)
        .replace(/\.md$/, "")
        .split(path.sep)
        .join("/");
      const meta: PageMeta = {
        slug,
        title: typeof data.title === "string" ? data.title : slug,
        visibility: data.visibility === "gm" ? "gm" : "player",
      };
      return { meta, content };
    }),
  );
}

export async function listPages(role: Role): Promise<PageMeta[]> {
  const pages = await loadAll();
  return pages
    .map((page) => page.meta)
    .filter((meta) => canSee(role, meta.visibility))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Returns rendered HTML for the page, or null if missing or hidden from this role. */
export async function getPage(role: Role, slug: string) {
  const page = (await loadAll()).find((p) => p.meta.slug === slug);
  if (!page || !canSee(role, page.meta.visibility)) return null;

  // GM sections are removed here, on the server, so players never receive them.
  const markdown = page.content.replace(GM_BLOCK, (_, inner: string) =>
    role === "gm" ? `<div class="gm-only">\n\n${inner}\n\n</div>` : "",
  );
  return { meta: page.meta, html: await marked.parse(markdown) };
}
