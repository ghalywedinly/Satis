import { SatisSeal } from "@/components/brand/seal";
import { StarBlocks } from "@/components/brand/star-blocks";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

type Distribution = { stars: string; share: number; value: string; tone: "zest" | "grey" | "ember" };

/**
 * The Satis Score hero (Ink): average rating out of 5 with star blocks, how ratings split
 * across 1–5, the trend over the period, and the seal. All text arrives translated.
 */
export function ScoreHero({
  score,
  labels,
  distribution,
  spark,
  trend,
}: {
  score: number | null;
  labels: { eyebrow: string; value: string; outOf: string; stars: string; basis: string; distribution: string; trendCaption: string; linkLabel: string; linkHref: "/surveys" | "/locations" };
  distribution: Distribution[];
  /** Day-by-day average ratings, oldest first; nulls are skipped. */
  spark: (number | null)[];
  trend: { text: string; good: boolean | null } | null;
}) {
  const known = spark.map((v, i) => [i, v] as const).filter((p): p is readonly [number, number] => p[1] !== null);
  const lo = Math.min(...known.map((p) => p[1]), 5);
  const hi = Math.max(...known.map((p) => p[1]), 1);
  const n = Math.max(spark.length - 1, 1);
  const path = known.map(([i, v], k) => `${k ? "L" : "M"}${((i / n) * 152 + 4).toFixed(1)} ${(34 - ((v - lo) / (hi - lo || 1)) * 28).toFixed(1)}`).join(" ");

  return (
    <section aria-label={labels.eyebrow} className="grid items-center gap-6 rounded-[24px] bg-ink p-6 text-white sm:p-7 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto]">
      <div className="flex min-w-0 flex-col gap-3">
        <span className="text-sm font-bold text-zest">{labels.eyebrow}</span>
        <span className="flex items-baseline gap-2">
          <span className="font-display text-7xl leading-[0.95] font-extrabold tracking-tighter tabular">{labels.value}</span>
          <span className="font-display text-xl font-bold text-ink-400">{labels.outOf}</span>
        </span>
        {score !== null && (
          <span role="img" aria-label={labels.stars}>
            <StarBlocks score={score} size="lg" onInk />
          </span>
        )}
        <span className="text-sm text-ink-300">{labels.basis}</span>
        {known.length > 1 && (
          <div className="flex items-center gap-3">
            <svg aria-hidden viewBox="0 0 160 40" className="h-10 w-40 shrink-0 rtl:-scale-x-100">
              <path d={path} fill="none" stroke="#FFCF28" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="flex flex-col text-xs">
              {trend && <span className={cn("font-display text-sm font-extrabold", trend.good === false ? "text-ember" : "text-mint")}>{trend.text}</span>}
              <span className="text-ink-400">{labels.trendCaption}</span>
            </span>
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-col gap-2.5">
        <span className="text-xs text-ink-400">{labels.distribution}</span>
        {distribution.map((d) => (
          <div key={d.stars} className="grid grid-cols-[3.25rem_minmax(0,1fr)_2.75rem] items-center gap-2.5 text-xs">
            <span className="font-bold whitespace-nowrap text-ink-200 tabular">{d.stars}</span>
            <span className="h-2 overflow-hidden rounded-full bg-ink-800">
              <span
                className={cn("block h-full rounded-full", d.tone === "zest" ? "bg-zest" : d.tone === "ember" ? "bg-ember" : "bg-ink-400")}
                style={{ width: `${Math.round(d.share * 100)}%` }}
              />
            </span>
            <span className="text-end font-display font-bold text-ink-200 tabular">{d.value}</span>
          </div>
        ))}
      </div>

      <div className="hidden flex-col items-center gap-2 md:flex">
        <SatisSeal ring className="size-32" />
        <Link href={labels.linkHref} className="rounded-sm text-xs font-semibold text-zest outline-none hover:underline focus-visible:shadow-focus">
          {labels.linkLabel}
        </Link>
      </div>
    </section>
  );
}
