import type { CSSProperties } from "react";
import type { Infobox as InfoboxData } from "@/lib/content";

/**
 * Fact box floated beside the article, like a wiki infobox. The title bar
 * takes the page's guild gradient (--from/--to) when it has one.
 */
export function Infobox({
  title,
  infobox,
  style,
}: {
  title: string;
  infobox: InfoboxData;
  style?: CSSProperties;
}) {
  return (
    <aside
      style={style}
      className="mb-6 overflow-hidden rounded border border-sidebar-rule/60 bg-sidebar-bg font-sans text-base shadow-sm md:float-right md:mb-4 md:ml-6 md:w-72"
    >
      {infobox.image && (
        <figure>
          {/* eslint-disable-next-line @next/next/no-img-element -- served by our own /media route */}
          <img
            src={infobox.image}
            alt=""
            className="max-h-96 w-full object-cover md:max-h-none"
          />
          {infobox.caption && (
            <figcaption className="px-3 py-2 text-center text-sm text-muted italic">
              {infobox.caption}
            </figcaption>
          )}
        </figure>
      )}
      <h2 className="relative px-3 py-1.5 text-center text-lg">
        <span
          aria-hidden
          className="absolute inset-0 bg-linear-90 from-(--from) to-(--to) opacity-35"
        />
        <span className="relative">{title}</span>
      </h2>
      {infobox.fields.length > 0 && (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 px-3 py-2">
          {infobox.fields.map((field) => (
            <div
              key={field.label}
              className="col-span-2 grid grid-cols-subgrid border-b border-sidebar-rule/30 py-1.5 last:border-b-0"
            >
              <dt className="font-bold">{field.label}</dt>
              {field.html ? (
                <dd className="[&_a]:underline" dangerouslySetInnerHTML={{ __html: field.html }} />
              ) : (
                <dd className="text-muted">—</dd>
              )}
            </div>
          ))}
        </dl>
      )}
    </aside>
  );
}
