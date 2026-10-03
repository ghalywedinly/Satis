import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type Trend = { direction: "up" | "down" | "same"; label: string; good: boolean | null };

const ACCENTS = {
  ultra: "bg-ultra-50 text-ultramarine",
  mint: "bg-mint-50 text-mint-700",
  ember: "bg-ember-50 text-ember-700",
  grape: "bg-grape-50 text-grape-600",
} as const;

/** A KPI: label, big value, an optional line of context and a change versus the previous period. */
export function StatTile({
  label,
  value,
  hint,
  detail,
  trend,
  trendCaption,
  icon: Icon,
  accent = "ultra",
  visual,
}: {
  label: string;
  value: string;
  hint?: string;
  detail?: string;
  trend?: Trend | null;
  trendCaption: string;
  icon?: LucideIcon;
  accent?: keyof typeof ACCENTS;
  /** A small decorative picture of the number (e.g. mini bars), hidden from screen readers. */
  visual?: React.ReactNode;
}) {
  const TrendIcon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  return (
    <div role="group" aria-label={label} className="relative flex flex-col gap-2 overflow-hidden rounded-card border glass p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-muted-foreground" title={hint}>
          {label}
        </p>
        {Icon && (
          <span aria-hidden className={cn("slice-sm flex h-8 w-10 shrink-0 items-center justify-center", ACCENTS[accent])}>
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
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      <p className="mt-auto flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
              trend.good === null ? "bg-sand-100 text-ink-600" : trend.good ? "bg-mint-50 text-mint-700" : "bg-ember-50 text-ember-700",
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

/** Tiny slanted columns for the last days, the brand's slice in miniature. Newest is darkest. */
export function MiniBars({ values, className }: { values: number[]; className?: string }) {
  const max = Math.max(...values, 1);
  const recent = values.slice(-12);
  return (
    <div className={cn("flex h-9 items-end gap-[3px]", className)}>
      {recent.map((v, i) => (
        <span
          key={i}
          className={cn("w-1.5 -skew-x-[14deg] rounded-t-[2px]", i === recent.length - 1 ? "bg-ultramarine" : "bg-ultra-200")}
          style={{ height: `${Math.max((v / max) * 100, 8)}%` }}
        />
      ))}
    </div>
  );
}

/** A ring showing a share out of 100%, in one hue on a lighter step of it. */
export function MiniRing({ ratio, tone = "ultra" }: { ratio: number; tone?: "ultra" | "mint" }) {
  const c = 2 * Math.PI * 15;
  return (
    <svg viewBox="0 0 36 36" className="size-10 -rotate-90">
      <circle cx="18" cy="18" r="15" fill="none" strokeWidth="5" className={tone === "mint" ? "stroke-mint-50" : "stroke-ultra-50"} />
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${Math.max(0, Math.min(1, ratio)) * c} ${c}`}
        className={tone === "mint" ? "stroke-mint-600" : "stroke-ultramarine"}
      />
    </svg>
  );
}
