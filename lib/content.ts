import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { Marked } from "marked";
import type { Role } from "./session";

const PAGES_DIR = path.join(process.cwd(), "content", "pages");

const IMAGE_TYPES: Record<string, string> = {
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

// Inline GM-only sections:
//   :::gm
//   The innkeeper is secretly a dragon.
//   :::
const GM_BLOCK = /^:::gm[ \t]*\r?\n([\s\S]*?)\r?\n:::[ \t]*$/gm;

export type PageMeta = {
  slug: string;
  title: string;
  visibility: Role;
  /** /media URL of the `icon` frontmatter image, e.g. a guild logo. */
  icon?: string;
  order?: number;
  /** Guild color pair from the `colors` frontmatter, e.g. ["green", "white"]. */
  colors?: [ManaColor, ManaColor];
};

const MANA_COLORS = ["white", "blue", "black", "red", "green"] as const;
export type ManaColor = (typeof MANA_COLORS)[number];

function parseColors(value: unknown): PageMeta["colors"] {
  if (!Array.isArray(value)) return undefined;
  const colors = value.filter((c): c is ManaColor => MANA_COLORS.includes(c));
  if (colors.length === 0) return undefined;
  return [colors[0], colors[1] ?? colors[0]];
}

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
      const iconPath = typeof data.icon === "string" ? resolveImage(slug, data.icon) : null;
      const meta: PageMeta = {
        slug,
        title: typeof data.title === "string" ? data.title : slug,
        visibility: data.visibility === "gm" ? "gm" : "player",
        icon: iconPath ? mediaUrl(iconPath) : undefined,
        order: typeof data.order === "number" ? data.order : undefined,
        colors: parseColors(data.colors),
      };
      return { meta, content, iconPath };
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

/** Guild pages with an icon, in `order`, for the landing page wheel. */
export async function listGuilds(role: Role): Promise<PageMeta[]> {
  return (await listPages(role))
    .filter((meta) => meta.slug.startsWith("guilds/") && meta.icon)
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}

// GM sections are removed here, on the server, so players never receive them.
function visibleMarkdown(role: Role, content: string) {
  return content.replace(GM_BLOCK, (_, inner: string) =>
    role === "gm" ? `<div class="gm-only">\n\n${inner}\n\n</div>` : "",
  );
}

/**
 * Resolves an image reference to a path under pages/. Relative paths are
 * relative to the page's folder; a leading "/" means the pages/ root.
 * Returns null for external URLs.
 */
function resolveImage(slug: string, href: string) {
  if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(href)) return null;
  let target;
  try {
    target = decodeURI(href.split(/[?#]/)[0]);
  } catch {
    return null;
  }
  const base = target.startsWith("/") ? "/" : path.posix.join("/", path.posix.dirname(slug));
  // Normalizing from "/" means "../" can never climb out of pages/.
  return path.posix.normalize(path.posix.join(base, target)).slice(1);
}

function mediaUrl(imagePath: string) {
  return `/media/${imagePath.split("/").map(encodeURIComponent).join("/")}`;
}

/** Renders markdown, pointing local images at /media and listing them. */
async function render(slug: string, markdown: string) {
  const images = new Set<string>();
  const parser = new Marked({
    walkTokens(token) {
      if (token.type !== "image") return;
      const imagePath = resolveImage(slug, token.href);
      if (!imagePath) return;
      images.add(imagePath);
      token.href = mediaUrl(imagePath);
    },
  });
  return { html: await parser.parse(markdown), images };
}

/** Returns rendered HTML for the page, or null if missing or hidden from this role. */
export async function getPage(role: Role, slug: string) {
  const page = (await loadAll()).find((p) => p.meta.slug === slug);
  if (!page || !canSee(role, page.meta.visibility)) return null;

  const { html } = await render(slug, visibleMarkdown(role, page.content));
  return { meta: page.meta, html };
}

/**
 * Players may only load images that appear in content they can see, so an
 * image used only in GM pages or :::gm blocks can't be fetched by guessing its URL.
 */
async function canViewImage(role: Role, imagePath: string) {
  if (role === "gm") return true;
  for (const page of await loadAll()) {
    if (!canSee(role, page.meta.visibility)) continue;
    if (page.iconPath === imagePath) return true;
    const { images } = await render(page.meta.slug, visibleMarkdown(role, page.content));
    if (images.has(imagePath)) return true;
  }
  return false;
}

/** Returns the image file and its content type, or null if missing or hidden from this role. */
export async function getImage(role: Role, requested: string) {
  const imagePath = path.posix.normalize(path.posix.join("/", requested)).slice(1);
  const type = IMAGE_TYPES[path.posix.extname(imagePath).toLowerCase()];
  if (!type || !(await canViewImage(role, imagePath))) return null;

  try {
    return { data: await readFile(path.join(PAGES_DIR, imagePath)), type };
  } catch {
    return null;
  }
}
