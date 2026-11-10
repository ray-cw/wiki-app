import { getImage } from "@/lib/content";
import { getRole } from "@/lib/session";

export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const role = await getRole();
  const { path } = await ctx.params;
  // Missing, hidden and logged-out all look the same, so nothing leaks.
  const image = role && (await getImage(role, path.map(decodeURIComponent).join("/")));
  if (!image) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(image.data), {
    headers: {
      "Content-Type": image.type,
      // Browser-only cache; never stored by Vercel's CDN.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      // Stops scripts inside an SVG from running if it's opened directly.
      "Content-Security-Policy": "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
