"use client";

import Link from "next/link";
import { useState } from "react";
import type { ManaColor } from "@/lib/content";
import { guildColorVars } from "./guild-colors";

type Guild = { slug: string; title: string; icon: string; colors?: [ManaColor, ManaColor] };

const RADIUS = 39; // % of the wheel, from its center to each guild's center

// Sunburst behind the center disc, echoing the Guildpact emblem.
const SPIKES = 24;
const sunburst = Array.from({ length: SPIKES * 2 }, (_, i) => {
  const r = i % 2 === 0 ? 50 : 41;
  const angle = (i / (SPIKES * 2)) * 2 * Math.PI;
  return `${(50 + r * Math.sin(angle)).toFixed(2)},${(50 - r * Math.cos(angle)).toFixed(2)}`;
}).join(" ");

export function GuildWheel({ guilds }: { guilds: Guild[] }) {
  const [active, setActive] = useState<Guild | null>(null);

  return (
    <nav
      aria-label="Guilds"
      className="relative aspect-square w-full max-w-160"
      style={guildColorVars(active?.colors)}
    >
      {/* Faint ring the guild discs sit on */}
      <div className="absolute inset-[11%] rounded-full border border-disc-ring/35" />

      <svg
        viewBox="0 0 100 100"
        aria-hidden
        className="absolute top-1/2 left-1/2 w-[56%] -translate-1/2 overflow-visible"
      >
        <defs>
          <linearGradient id="sunburst-guild" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--from)" />
            <stop offset="1" stopColor="var(--to)" />
          </linearGradient>
        </defs>
        <polygon points={sunburst} className="fill-disc-ring opacity-55" />
        {/* Takes on the hovered guild's colors */}
        <polygon
          points={sunburst}
          fill="url(#sunburst-guild)"
          className={`transition-opacity duration-300 ${active ? "opacity-80" : "opacity-0"}`}
        />
      </svg>

      <Link
        href="/pages"
        className="group/center absolute top-1/2 left-1/2 flex aspect-square w-[46%] -translate-1/2 flex-col items-center justify-center gap-1.5 rounded-full bg-disc p-[10%] text-center text-disc-text ring-2 ring-disc-ring ring-offset-3 ring-offset-disc"
      >
        <span
          className={`font-heading text-[clamp(1.1rem,4.5vw,2rem)] leading-tight ${
            active ? "bg-linear-135 from-(--from) to-(--to) bg-clip-text text-transparent" : ""
          }`}
        >
          {active?.title ?? "Ravnica"}
        </span>
        <span className="font-sans text-[clamp(0.6rem,2vw,0.8rem)] tracking-widest text-disc-ring uppercase group-hover/center:text-glow">
          {active ? "Enter the guild" : "All pages"}
        </span>
      </Link>

      {guilds.map((guild, i) => {
        // Start at the top and go clockwise.
        const angle = (i / guilds.length) * 2 * Math.PI - Math.PI / 2;
        const left = (50 + RADIUS * Math.cos(angle)).toFixed(3);
        const top = (50 + RADIUS * Math.sin(angle)).toFixed(3);
        return (
          <Link
            key={guild.slug}
            href={`/wiki/${guild.slug}`}
            aria-label={guild.title}
            className="group absolute aspect-square w-[19%] -translate-1/2 rounded-full outline-none transition-transform duration-200 hover:z-10 hover:scale-112 focus-visible:z-10 focus-visible:scale-112"
            style={{ left: `${left}%`, top: `${top}%`, ...guildColorVars(guild.colors) }}
            onMouseEnter={() => setActive(guild)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(guild)}
            onBlur={() => setActive(null)}
          >
            <GuildDisc icon={guild.icon} />
          </Link>
        );
      })}
    </nav>
  );
}

/**
 * A logo on a dark disc with a silver ring. Inside a `group` with --from/--to
 * set, hovering swaps the ring for the guild's gradient and adds a matching glow;
 * `lit` shows the gradient ring all the time.
 */
export function GuildDisc({ icon, lit = false }: { icon: string; lit?: boolean }) {
  return (
    <>
      <span
        aria-hidden
        className={`absolute -inset-[16%] rounded-full bg-linear-135 from-(--from) to-(--to) blur-xl transition-opacity duration-200 group-hover:opacity-75 group-focus-visible:opacity-75 ${
          lit ? "opacity-35" : "opacity-0"
        }`}
      />
      <span aria-hidden className="absolute -inset-1.25 rounded-full bg-disc-ring" />
      <span
        aria-hidden
        className={`absolute -inset-1.25 rounded-full bg-linear-135 from-(--from) to-(--to) transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 ${
          lit ? "opacity-100" : "opacity-0"
        }`}
      />
      <span className="relative grid size-full place-items-center rounded-full bg-disc ring-3 ring-disc">
        {/* eslint-disable-next-line @next/next/no-img-element -- served by our own /media route */}
        <img
          src={icon}
          alt=""
          className="size-[70%] object-contain opacity-85 transition duration-200 group-hover:opacity-100 group-hover:drop-shadow-[0_0_6px_var(--from)] group-focus-visible:opacity-100"
        />
      </span>
    </>
  );
}
