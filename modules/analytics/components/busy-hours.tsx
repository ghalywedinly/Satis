"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/** level 0–4: share of low ratings in that hour; null when there were no responses. */
export type BusyCell = { level: number | null; label: string };
export type BusyRow = { day: string; cells: BusyCell[] };

const LEVELS = ["bg-ember-50", "bg-ember-200", "bg-[#FFA58C]", "bg-ember-500", "bg-ember-700"];

/**
 * When customers are unhappy: weekdays down, hours across, Ember darker where more of the
 * ratings were low. Hover or tap a cell for its numbers; the summary sentence carries the
 * finding for screen readers.
 */
export function BusyHours({ rows, hours, summary, legend }: { rows: BusyRow[]; hours: string[]; summary: string; legend: { less: string; more: string; none: string } }) {
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const tip = active ? rows[active.r]?.cells[active.c]?.label : null;
  return (
    <div className="flex flex-col gap-3">
      <div className="relative" onPointerLeave={() => setActive(null)}>
        <div role="img" aria-label={summary} className="grid items-center gap-[3px]" style={{ gridTemplateColumns: `3.25rem repeat(${hours.length}, minmax(0, 1fr))` }}>
          <span />
          {hours.map((h, i) => (
            <span key={i} aria-hidden className="text-center text-[10px] text-ink-500 tabular">
              {h}
            </span>
          ))}
          {rows.map((row, r) => (
            <div key={row.day} className="contents">
              <span aria-hidden className="truncate text-xs text-ink-600">
                {row.day}
              </span>
              {row.cells.map((cell, c) => (
                <span
                  key={c}
                  aria-hidden
                  onPointerEnter={() => setActive({ r, c })}
                  onPointerDown={() => setActive({ r, c })}
                  className={cn(
                    "block h-6 rounded-[5px] transition-transform duration-[140ms] ease-[var(--ease-standard)] motion-safe:hover:scale-110",
                    cell.level === null ? "bg-ink-50" : LEVELS[cell.level],
                    active?.r === r && active?.c === c && "outline-2 outline-ink",
                  )}
                />
              ))}
            </div>
          ))}
        </div>
        {tip && (
          <div aria-hidden className="pointer-events-none absolute -top-3 start-1/2 z-10 -translate-x-1/2 rtl:translate-x-1/2 -translate-y-full rounded-control bg-ink px-3 py-2 text-xs whitespace-nowrap text-white">
            {tip}
          </div>
        )}
      </div>
      <div aria-hidden className="flex flex-wrap items-center gap-2 text-xs text-ink-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-5 rounded-[3px] bg-ink-50 ring-1 ring-ink-100" />
          {legend.none}
        </span>
        <span className="ms-2">{legend.less}</span>
        <span className="flex gap-[3px]">
          {LEVELS.map((l) => (
            <span key={l} className={cn("h-2.5 w-5 rounded-[3px]", l)} />
          ))}
        </span>
        <span>{legend.more}</span>
      </div>
    </div>
  );
}
