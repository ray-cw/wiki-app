import "server-only";
import { statSync } from "node:fs";
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

// Fenced blocks, which can nest:
//   :::sidebar Tavern Rumors      boxed text everyone sees; the title is optional
//   The ale is watered down.
//   :::gm                         GM-only section
//   The innkeeper is secretly a dragon.
//   :::
//   :::
const BLOCK_OPEN = /^:::(gm|sidebar)(?:[ \t]+(.*?))?[ \t]*$/;
const BLOCK_CLOSE = /^:::[ \t]*$/;
const CODE_FENCE = /^ {0,3}(```|~~~)/;

export type PageMeta = {
  slug: string;
  title: string;
  subtitle?: string;
  visibility: Role;
  /** /media URL of the `icon` frontmatter image, e.g. a guild logo. */
  icon?: string;
  order?: number;
  /** Guild color pair from the `colors` frontmatter, e.g. ["green", "white"]. */
  colors?: [ManaColor, ManaColor];
  infobox?: Infobox;
};

/**
 * Wiki-style fact box from the `infobox` frontmatter:
 *   infobox:
 *     image: banners/izzet.jpg
 *     caption: optional text under the image
 *     fields:
 *       Parun: Niv-Mizzet
 *       Guildhall: "[Nivix](/wiki/places/nivix)"
 * Field values are inline Markdown, rendered to HTML here; empty ones are null.
 */
export type Infobox = {
  image?: string;
  caption?: string;
  fields: { label: string; html: string | null }[];
};

function parseInfobox(slug: string, value: unknown) {
  if (!value || typeof value !== "object") return { infobox: undefined, imagePath: null };
  const { image, caption, fields } = value as Record<string, unknown>;
  const imagePath = typeof image === "string" ? resolveImage(slug, image) : null;
  const inline = new Marked();
  const infobox: Infobox = {
    image: imagePath ? mediaUrl(imagePath) : undefined,
    caption: typeof caption === "string" ? caption : undefined,
    fields: Object.entries(fields && typeof fields === "object" ? fields : {}).map(([label, raw]) => ({
      label,
      html: raw == null || raw === "" ? null : (inline.parseInline(String(raw)) as string),
    })),
  };
  return { infobox, imagePath };
}

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
      const { infobox, imagePath: infoboxImagePath } = parseInfobox(slug, data.infobox);
      const meta: PageMeta = {
        slug,
        title: typeof data.title === "string" ? data.title : slug,
        subtitle: typeof data.subtitle === "string" ? data.subtitle : undefined,
        visibility: data.visibility === "gm" ? "gm" : "player",
        icon: iconPath ? mediaUrl(iconPath) : undefined,
        order: typeof data.order === "number" ? data.order : undefined,
        colors: parseColors(data.colors),
        infobox,
      };
      // Images named in frontmatter rather than the page body.
      const frontmatterImages = [iconPath, infoboxImagePath].filter((p): p is string => Boolean(p));
      return { meta, content, frontmatterImages };
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

function escapeHtml(text: string) {
  return text.replace(/[&<>"]/g, (c) => `&${{ "&": "amp", "<": "lt", ">": "gt", '"': "quot" }[c]};`);
}

/**
 * Turns :::gm and :::sidebar blocks into HTML wrappers. GM sections are
 * removed here, on the server, so players never receive them. An unclosed
 * GM block hides everything after it rather than leaking it.
 */
function visibleMarkdown(role: Role, content: string) {
  const out: string[] = [];
  const open: { tag: string; hidden: boolean }[] = [];
  let inCode = false;

  for (const line of content.split(/\r?\n/)) {
    const hidden = open.at(-1)?.hidden ?? false;
    if (CODE_FENCE.test(line)) inCode = !inCode;

    const opening = inCode ? null : BLOCK_OPEN.exec(line);
    if (opening) {
      const [, kind, title] = opening;
      if (hidden || (kind === "gm" && role !== "gm")) {
        open.push({ tag: "", hidden: true });
      } else if (kind === "gm") {
        open.push({ tag: "div", hidden: false });
        out.push('<div class="gm-only">', "");
      } else {
        open.push({ tag: "aside", hidden: false });
        out.push('<aside class="sidebar">', "");
        if (title) out.push(`<p class="sidebar-title">${escapeHtml(title)}</p>`, "");
      }
      continue;
    }

    if (!inCode && open.length > 0 && BLOCK_CLOSE.test(line)) {
      const block = open.pop()!;
      if (!block.hidden) out.push("", `</${block.tag}>`, "");
      continue;
    }

    if (!hidden) out.push(line);
  }

  // Close any visible blocks the author left open.
  for (const block of open.reverse()) {
    if (!block.hidden) out.push("", `</${block.tag}>`);
  }
  return out.join("\n");
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

/**
 * /media URL for an image, with ?v= changing whenever the file does (and on
 * every deploy, since the content is freshly cloned), so browsers can cache
 * it for a long time yet never show a stale image.
 */
function mediaUrl(imagePath: string) {
  const url = `/media/${imagePath.split("/").map(encodeURIComponent).join("/")}`;
  try {
    const { mtimeMs, size } = statSync(path.join(PAGES_DIR, imagePath));
    return `${url}?v=${Math.floor(mtimeMs).toString(36)}${size.toString(36)}`;
  } catch {
    return url;
  }
}

/** Renders markdown, pointing local images at /media and listing them. */
async function render(slug: string, markdown: string) {
  const images = new Set<string>();
  const headings: { id: string; title: string }[] = [];
  const headingIds = new Set<string>();
  const parser = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        // Keep labels plain text; inline formatting still renders in the heading.
        const title = html.replace(/<[^>]*>/g, "");
        const base = title.toLowerCase().replace(/&[^;]+;/g, " ").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
        let id = base;
        for (let suffix = 2; headingIds.has(id); suffix++) id = `${base}-${suffix}`;
        headingIds.add(id);
        if (depth === 2) headings.push({ id, title });
        return `<h${depth} id="${id}">${html}</h${depth}>\n`;
      },
    },
    walkTokens(token) {
      if (token.type !== "image") return;
      const imagePath = resolveImage(slug, token.href);
      if (!imagePath) return;
      images.add(imagePath);
      token.href = mediaUrl(imagePath);
    },
    hooks: {
      // Wide tables scroll inside this wrapper instead of widening the page.
      postprocess(html) {
        html = html.replaceAll("<table>", '<div class="table-scroll"><table>').replaceAll("</table>", "</table></div>");
        if (headings.length < 2) return html;
        const links = headings.map(({ id, title }) => `<li><a href="#${id}">${title}</a></li>`).join("");
        const toc = `<nav class="wiki-toc" aria-label="Contents"><p class="wiki-toc-title">Contents</p><ol>${links}</ol></nav>\n`;
        // Preserve the opening description, then place navigation before the sections.
        return html.replace(/<h2\b/, `${toc}<h2`);
      },
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
    if (page.frontmatterImages.includes(imagePath)) return true;
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
