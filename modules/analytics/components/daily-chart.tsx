"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

/** One day. Labels arrive pre-formatted from the server (Western digits, Saudi dates). */
export type DailyPoint = { day: string; dayLabel: string; value: number | null; valueLabel: string };

/**
 * Single-series chart of one value per day: columns for counts, a line for rates.
 * Time runs in the reading direction (right to left in Arabic). Hover or tap a day for its
 * value; a table with every value is always available to screen readers.
 */
export function DailyChart({
  points,
  max,
  mode,
  ticks,
  caption,
  dayHeader,
  valueHeader,
}: {
  points: DailyPoint[];
  max: number;
  mode: "columns" | "line";
  /** Gridline values with their labels, e.g. [{ value: 0, label: "0" }, …]. */
  ticks: { value: number; label: string }[];
  caption: string;
  dayHeader: string;
  valueHeader: string;
}) {
  const rtl = useLocale() === "ar";
  const [active, setActive] = useState<number | null>(null);
  const n = points.length;
  const y = (value: number) => (max > 0 ? (value / max) * 100 : 0);
  // Horizontal centre of slot i, in physical SVG coordinates (0–100).
  const x = (i: number) => {
    const start = ((i + 0.5) / n) * 100;
    return rtl ? 100 - start : start;
  };
  // The line breaks across days without a value instead of inventing one.
  const segments: string[] = [];
  let current = "";
  points.forEach((p, i) => {
    if (p.value === null) {
      if (current) segments.push(current);
      current = "";
      return;
    }
    current += `${current ? "L" : "M"}${x(i)},${100 - y(p.value)}`;
  });
  if (current) segments.push(current);
  const labelEvery = Math.max(1, Math.ceil(n / 6));
  const activePoint = active === null ? null : points[active];

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        {/* Y-axis labels, at the start side. */}
        <div aria-hidden className="relative h-44 w-10 shrink-0 text-xs text-muted-foreground tabular">
          {ticks.map((tick) => (
            <span key={tick.value} className="absolute end-0 -translate-y-1/2" style={{ top: `${100 - y(tick.value)}%` }}>
              {tick.label}
            </span>
          ))}
        </div>
        <div className="relative h-44 flex-1" onPointerLeave={() => setActive(null)}>
          {ticks.map((tick) => (
            <div key={tick.value} aria-hidden className="absolute inset-x-0 border-t border-ink-100" style={{ top: `${100 - y(tick.value)}%` }} />
          ))}

          {mode === "columns" ? (
            <div aria-hidden className="absolute inset-0 flex items-end">
              {points.map((p, i) => (
                <div key={p.day} className="flex h-full flex-1 items-end justify-center px-px">
                  <div
                    className={cn(
                      "w-full max-w-6 rounded-t-[4px] transition-colors duration-[140ms]",
                      active === i ? "bg-ultra-700" : "bg-ultramarine",
                    )}
                    style={{ height: `${y(p.value ?? 0)}%`, minHeight: p.value ? 2 : 0 }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
                {activePoint && <line x1={x(active!)} x2={x(active!)} y1={0} y2={100} className="stroke-ink-200" strokeWidth={1} vectorEffect="non-scaling-stroke" />}
                {segments.map((d) => (
                  <path key={d} d={d} fill="none" className="stroke-ultramarine" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
                ))}
              </svg>
              {points.map((p, i) =>
                p.value === null ? null : (
                  <span
                    key={p.day}
                    aria-hidden
                    className={cn(
                      "absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ultramarine ring-2 ring-white",
                      active === i ? "scale-125" : n > 31 && "hidden",
                    )}
                    style={{ left: `${x(i)}%`, top: `${100 - y(p.value)}%` }}
                  />
                ),
              )}
            </>
          )}

          {/* Hover/tap targets: one full-height slot per day. */}
          <div aria-hidden className="absolute inset-0 flex">
            {points.map((p, i) => (
              <div key={p.day} className="h-full flex-1" onPointerEnter={() => setActive(i)} onPointerDown={() => setActive(i)} />
            ))}
          </div>

          {activePoint && (
            <div
              aria-hidden
              className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-control bg-ink px-2.5 py-1.5 text-xs whitespace-nowrap text-white"
              style={{ left: `${Math.min(88, Math.max(12, x(active!)))}%` }}
            >
              <span className="block text-ink-300">{activePoint.dayLabel}</span>
              <span className="font-semibold">{activePoint.valueLabel}</span>
            </div>
          )}
        </div>
      </div>
      <div aria-hidden className="flex ps-12 text-xs text-muted-foreground">
        {points.map((p, i) => (
          <span key={p.day} className="flex-1 truncate text-center">
            {i % labelEvery === 0 || i === n - 1 ? p.dayLabel : ""}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{dayHeader}</th>
            <th scope="col">{valueHeader}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.day}>
              <td>{p.dayLabel}</td>
              <td>{p.valueLabel}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
