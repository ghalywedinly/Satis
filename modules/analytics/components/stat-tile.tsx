import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export type Trend = { direction: "up" | "down" | "same"; label: string; good: boolean | null };

/** A KPI: label, big value, an optional line of context and a change versus the previous period. */
export function StatTile({ label, value, hint, detail, trend, trendCaption }: { label: string; value: string; hint?: string; detail?: string; trend?: Trend | null; trendCaption: string }) {
  const Icon = trend?.direction === "up" ? ArrowUpRight : trend?.direction === "down" ? ArrowDownRight : Minus;
  return (
    <div className="flex flex-col gap-2 rounded-card border border-border bg-white p-5">
      <p className="text-sm font-semibold text-muted-foreground" title={hint}>
        {label}
      </p>
      <p className="font-display text-4xl font-extrabold tracking-tight">{value}</p>
      {detail && <p className="text-sm text-muted-foreground">{detail}</p>}
      <p className="mt-auto flex items-center gap-1.5 text-xs text-muted-foreground">
        {trend && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold",
              trend.good === null ? "bg-sand-100 text-ink-600" : trend.good ? "bg-mint-50 text-mint-700" : "bg-ember-50 text-ember-700",
            )}
          >
            <Icon aria-hidden strokeWidth={1.75} className="size-3.5 rtl:-scale-x-100" />
            {trend.label}
          </span>
        )}
        {trendCaption}
      </p>
    </div>
  );
}
