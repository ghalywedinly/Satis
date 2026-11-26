"use client";

import { useState } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";

/** One day of one metric. Labels arrive pre-formatted from the server (Western digits). */
export type TrendPoint = { dayLabel: string; current: number | null; previous: number | null; currentLabel: string; previousLabel: string };

export type TrendSeries = {
  key: string;
  label: string;
  value: string;
  /** Change vs the previous period; good says whether to colour it Mint or Ember. */
  delta: { text: string; good: boolean | null } | null;
  note: string;
  title: string;
  subtitle: string;
  points: TrendPoint[];
  min: number;
  max: number;
  ticks: { value: number; label: string }[];
};

type Labels = { current: string; previous: string; tablist: string; day: string };

/** Small line of the current period, for a metric card. */
function Sparkline({ values, good }: { values: (number | null)[]; good: boolean | null }) {
  const rtl = useLocale() === "ar";
  const known = values.filter((v): v is number => v !== null);
  if (known.length < 2) return <span className="hidden h-8 w-24 sm:block" />;
  const lo = Math.min(...known);
  const hi = Math.max(...known);
  const n = values.length;
  let d = "";
  values.forEach((v, i) => {
    if (v === null) return;
    const x = ((rtl ? n - 1 - i : i) / (n - 1)) * 92 + 2;
    const y = 29 - ((v - lo) / (hi - lo || 1)) * 26;
    d += `${d ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return (
    <svg aria-hidden viewBox="0 0 96 32" className="hidden h-8 w-24 shrink-0 sm:block">
      <path d={d} fill="none" className={good === false ? "stroke-ember" : "stroke-mint"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Metric cards that double as tabs: choosing one shows its day-by-day chart, with the
 * previous period as a dashed line. Time runs in the reading direction. Hover or tap a day
 * for both values; a table with every value is always available to screen readers.
 */
export function TrendPanel({ series, labels }: { series: TrendSeries[]; labels: Labels }) {
  const rtl = useLocale() === "ar";
  const [selected, setSelected] = useState(series[0]?.key);
  const [active, setActive] = useState<number | null>(null);
  const s = series.find((x) => x.key === selected) ?? series[0];
  if (!s) return null;

  const n = s.points.length;
  const y = (v: number) => 100 - ((v - s.min) / (s.max - s.min || 1)) * 100;
  const x = (i: number) => {
    const start = n === 1 ? 50 : (i / (n - 1)) * 100;
    return rtl ? 100 - start : start;
  };
  const line = (pick: (p: TrendPoint) => number | null) => {
    let d = "";
    let pen = false;
    s.points.forEach((p, i) => {
      const v = pick(p);
      if (v === null) {
        pen = false;
        return;
      }
      d += `${pen ? "L" : "M"}${x(i)},${y(v)}`;
      pen = true;
    });
    return d;
  };
  const labelEvery = Math.max(1, Math.ceil(n / 6));
  const point = active === null ? null : s.points[active];
  const lastIndex = s.points.map((p) => p.current !== null).lastIndexOf(true);

  return (
    <div className="flex flex-col gap-4">
      <div role="tablist" aria-label={labels.tablist} className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {series.map((m) => {
          const on = m.key === s.key;
          return (
            <button
              key={m.key}
              type="button"
              role="tab"
              id={`trend-tab-${m.key}`}
              aria-selected={on}
              aria-controls="trend-panel"
              onClick={() => {
                setSelected(m.key);
                setActive(null);
              }}
              className={cn(
                "flex flex-col gap-2 rounded-card bg-white p-4 text-start outline-none transition-[border-color] duration-[140ms] ease-[var(--ease-standard)] focus-visible:shadow-focus active:translate-y-px",
                on ? "border-2 border-ink" : "m-px border border-ink-100 hover:border-ink-200",
              )}
            >
              <span className="flex w-full items-center gap-2 text-sm text-ink-500">
                <span className="flex-1">{m.label}</span>
                {m.delta && (
                  <span
                    className={cn(
                      "rounded-sm px-1.5 py-0.5 text-xs font-bold whitespace-nowrap",
                      m.delta.good === null ? "bg-ink-50 text-ink-600" : m.delta.good ? "bg-mint-50 text-mint-700" : "bg-ember-50 text-ember-700",
                    )}
                  >
                    {m.delta.text}
                  </span>
                )}
              </span>
              <span className="flex w-full items-end gap-3">
                <span className="flex-1 font-display text-2xl leading-tight font-extrabold tracking-tight tabular sm:text-3xl">{m.value}</span>
                <Sparkline values={m.points.map((p) => p.current)} good={m.delta?.good ?? null} />
              </span>
              <span className="text-xs text-ink-500">{m.note}</span>
            </button>
          );
        })}
      </div>

      <section id="trend-panel" role="tabpanel" aria-labelledby="trend-panel-title" className="flex flex-col gap-3 rounded-card border border-ink-100 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex min-w-48 flex-1 flex-col gap-0.5">
            <h2 id="trend-panel-title" className="font-sans text-base font-bold">{s.title}</h2>
            <p className="text-xs text-ink-500">{s.subtitle}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
            <span aria-hidden className="h-[3px] w-4 rounded-full bg-ultramarine" />
            {labels.current}
          </span>
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-600">
            <span aria-hidden className="w-4 border-t-2 border-dashed border-ink-400" />
            {labels.previous}
          </span>
        </div>

        <div className="flex gap-2">
          <div aria-hidden className="relative h-56 w-12 shrink-0 text-xs text-ink-500 tabular">
            {s.ticks.map((tick) => (
              <span key={tick.value} className="absolute end-0 -translate-y-1/2" style={{ top: `${y(tick.value)}%` }}>
                {tick.label}
              </span>
            ))}
          </div>
          <div className="relative h-56 flex-1" onPointerLeave={() => setActive(null)}>
            {s.ticks.map((tick) => (
              <div key={tick.value} aria-hidden className="absolute inset-x-0 border-t border-ink-100" style={{ top: `${y(tick.value)}%` }} />
            ))}
            <svg aria-hidden viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full overflow-visible">
              {point && <line x1={x(active!)} x2={x(active!)} y1={0} y2={100} className="stroke-ink" strokeWidth={1} strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />}
              <path d={line((p) => p.previous)} fill="none" className="stroke-ink-400" strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
              <path d={line((p) => p.current)} fill="none" className="stroke-ultramarine" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {s.points.map((p, i) =>
              p.current === null || (i !== active && i !== lastIndex) ? null : (
                <span
                  key={i}
                  aria-hidden
                  className="absolute size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-ultramarine ring-2 ring-white"
                  style={{ left: `${x(i)}%`, top: `${y(p.current)}%` }}
                />
              ),
            )}
            <div aria-hidden className="absolute inset-0 flex" dir="ltr">
              {s.points.map((_, slot) => {
                const i = rtl ? n - 1 - slot : slot;
                return <div key={slot} className="h-full flex-1" onPointerEnter={() => setActive(i)} onPointerDown={() => setActive(i)} />;
              })}
            </div>
            {point && (
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 z-10 flex -translate-x-1/2 flex-col gap-1 rounded-control bg-ink px-3 py-2 text-xs whitespace-nowrap text-white"
                style={{ left: `${Math.min(85, Math.max(15, x(active!)))}%` }}
              >
                <span className="text-ink-300">{point.dayLabel}</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-ultra-300" />
                  {labels.current}: <span className="font-bold">{point.currentLabel}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-ink-300" />
                  {labels.previous}: <span className="font-bold">{point.previousLabel}</span>
                </span>
              </div>
            )}
          </div>
        </div>
        <div aria-hidden className="flex ps-14 text-xs text-ink-500">
          {s.points.map((p, i) => (
            <span key={i} className="flex-1 truncate text-center">
              {i % labelEvery === 0 || i === n - 1 ? p.dayLabel : ""}
            </span>
          ))}
        </div>
        <table className="sr-only">
          <caption>{s.title}</caption>
          <thead>
            <tr>
              <th scope="col">{labels.day}</th>
              <th scope="col">{labels.current}</th>
              <th scope="col">{labels.previous}</th>
            </tr>
          </thead>
          <tbody>
            {s.points.map((p, i) => (
              <tr key={i}>
                <td>{p.dayLabel}</td>
                <td>{p.currentLabel}</td>
                <td>{p.previousLabel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
