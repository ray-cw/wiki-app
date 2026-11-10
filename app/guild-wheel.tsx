"use client";

import Link from "next/link";
import { useState } from "react";

type Guild = { slug: string; title: string; icon: string };

const RADIUS = 39; // % of the wheel, from its center to each guild's center

// Sunburst behind the center disc, echoing the Guildpact emblem.
const SPIKES = 24;
const sunburst = Array.from({ length: SPIKES * 2 }, (_, i) => {
  const r = i % 2 === 0 ? 50 : 41;
  const angle = (i / (SPIKES * 2)) * 2 * Math.PI;
  return `${(50 + r * Math.sin(angle)).toFixed(2)},${(50 - r * Math.cos(angle)).toFixed(2)}`;
}).join(" ");

export function GuildWheel({ guilds }: { guilds: Guild[] }) {
  const [active, setActive] = useState<string | null>(null);

  return (
    <nav aria-label="Guilds" className="wheel">
      <svg viewBox="0 0 100 100" className="wheel-sunburst" aria-hidden>
        <polygon points={sunburst} />
      </svg>
      <Link href="/pages" className="wheel-center">
        <span className="wheel-title">{active ?? "Ravnica"}</span>
        <span className="wheel-sub">{active ? "Enter the guild" : "All pages"}</span>
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
            className="wheel-guild"
            style={{ left: `${left}%`, top: `${top}%` }}
            onMouseEnter={() => setActive(guild.title)}
            onMouseLeave={() => setActive(null)}
            onFocus={() => setActive(guild.title)}
            onBlur={() => setActive(null)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- served by our own /media route */}
            <img src={guild.icon} alt="" />
          </Link>
        );
      })}
    </nav>
  );
}
