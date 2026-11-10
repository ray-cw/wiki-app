import type { CSSProperties } from "react";
import type { ManaColor } from "@/lib/content";

/**
 * Sets --from/--to to a guild's two mana colors (theme tokens in globals.css),
 * for gradient utilities like `from-(--from) to-(--to)`. Unaligned pages fall
 * back to the silver ring color.
 */
export function guildColorVars(colors?: [ManaColor, ManaColor]) {
  const [from, to] = colors ?? [];
  return {
    "--from": from ? `var(--color-mana-${from})` : "var(--color-disc-ring)",
    "--to": to ? `var(--color-mana-${to})` : "var(--color-disc-ring)",
  } as CSSProperties;
}
