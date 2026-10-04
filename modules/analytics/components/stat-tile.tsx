import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Trend = { direction: "up" | "down" | "same"; label: string; good: boolean | null };

/**
 * Tile grounds. Coloured tiles are solid brand plates (white on Ultramarine, Sand on Ink,
 * Ink on Ember, as the brand pairs them); glass is the quiet default.
 */
const TONES = {
  glass: { tile: "glass border", label: "text-muted-foreground", detail: "text-muted-foreground", chip: "bg-ultra-50 text-ultramarine", slices: "bg-ink" },
  ultra: { tile: "border-ultramarine bg-ultramarine text-white", label: "text-ultra-100", detail: "text-ultra-100", chip: "bg-white/15 text-white", slices: "bg-white" },
  ink: { tile: "border-ink bg-ink text-sand", label: "text-ink-300", detail: "text-ink-300", chip: "bg-white/10 text-sand", slices: "bg-ultramarine" },
  ember: { tile: "border-ember bg-ember text-ink", label: "text-ink-700", detail: "text-ink-700", chip: "bg-ink/10 text-ink", slices: "bg-ink" },
} as const;

export type TileTone = keyof typeof TONES;

/** A KPI: label, big value, an optional line of context and a change versus the previous period. */
export function StatTile({
  label,
  value,
  hint,
  detail,
  trend,
  trendCaption,
  icon: Icon,
  tone = "glass",
  visual,
}: {
  label: string;
  value: string;
  hint?: string;
  detail?: string;
  trend?: Trend | null;
  trendCaption: string;
  icon?: LucideIcon;
  tone?: TileTone;
  /** A small decorative picture of the number (e.g. mini bars), hidden from screen readers. */
  visual?: React.ReactNode;
}) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  const s = TONES[tone];
  return (
    <div role="group" aria-label={label} className={cn("relative isolate flex flex-col gap-2 overflow-hidden rounded-card border p-5", s.tile)}>
      {/* Speed-line slices tucked into the corner: the brand's signature, decorative only. */}
      <div aria-hidden className="pointer-events-none absolute -end-3 bottom-4 -z-10 flex w-24 flex-col items-end gap-1.5 opacity-15">
        <span className={cn("slice-sm h-2.5 w-full", s.slices)} />
        <span className={cn("slice-sm h-2.5 w-3/4", s.slices)} />
        <span className={cn("slice-sm h-2.5 w-1/2", s.slices)} />
      </div>
      <div className="flex items-start justify-between gap-3">
        <p className={cn("text-sm font-semibold", s.label)} title={hint}>
          {label}
        </p>
        {Icon && (
          <span aria-hidden className={cn("slice-sm flex h-8 w-10 shrink-0 items-center justify-center", s.chip)}>
            <Icon strokeWidth={1.75} className="size-4" />
          </span>
        )}
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="font-display text-4xl font-extrabold tracking-tight">{value}</p>
        {visual && (
          <div aria-hidden className="mb-1.5 shrink-0">
            {visual}
          </div>
        )}
      </div>
      {detail && <p className={cn("text-sm", s.detail)}>{detail}</p>}
      <p className={cn("mt-auto flex flex-wrap items-center gap-1.5 text-xs", s.detail)}>
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
              tone === "glass"
                ? trend.good === null
                  ? "bg-sand-100 text-ink-600"
                  : trend.good
                    ? "bg-mint-50 text-mint-700"
                    : "bg-ember-50 text-ember-700"
                : cn("bg-white", trend.good === null ? "text-ink-600" : trend.good ? "text-mint-700" : "text-ember-700"),
            )}
          >
            <TrendIcon aria-hidden strokeWidth={1.75} className="size-3.5 rtl:-scale-x-100" />
            {trend.label}
          </span>
        )}
        {trendCaption}
      </p>
    </div>
  );
}

/** Tiny slanted columns for the last days, the brand's slice in miniature. Newest is strongest. */
export function MiniBars({ values, onColor = false, className }: { values: number[]; onColor?: boolean; className?: string }) {
  const max = Math.max(...values, 1);
  const recent = values.slice(-12);
  return (
    <div className={cn("flex h-10 items-end gap-[3px]", className)}>
      {recent.map((v, i) => {
        const last = i === recent.length - 1;
        return (
          <span
            key={i}
            className={cn("w-1.5 -skew-x-[14deg] rounded-t-[2px]", onColor ? (last ? "bg-white" : "bg-white/45") : last ? "bg-ultramarine" : "bg-ultra-200")}
            style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
          />
        );
      })}
    </div>
  );
}

const RING = {
  ultra: ["stroke-ultra-50", "stroke-ultramarine"],
  mint: ["stroke-mint-50", "stroke-mint-600"],
  ink: ["stroke-ink-100", "stroke-ink"],
  sand: ["stroke-white/15", "stroke-sand"],
} as const;

/** A ring showing a share out of 100%, in one hue on a lighter step of it. */
export function MiniRing({ ratio, tone = "ultra" }: { ratio: number; tone?: keyof typeof RING }) {
  const c = 2 * Math.PI * 15;
  const [track, fill] = RING[tone];
  return (
    <svg viewBox="0 0 36 36" className="size-11 -rotate-90">
      <circle cx="18" cy="18" r="15" fill="none" strokeWidth="5" className={track} />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${Math.max(0, Math.min(1, ratio)) * c} ${c}`}
        className={fill}
      />
    </svg>
  );
}
