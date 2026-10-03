import { cn } from "@/lib/utils";

/** A labelled share: a swatch, a name and its value (text stays in ink, the swatch carries the colour). */
function Legend({ items }: { items: { label: string; value: string; swatch: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span aria-hidden className={cn("size-2.5 rounded-xs", item.swatch)} />
          <span className="text-muted-foreground">{item.label}</span>
          <span className="font-semibold tabular">{item.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** Detractors, passives and promoters as one bar, ordered from unhappy to happy, with a legend. */
export function NpsBar({ segments, label }: { segments: { key: string; label: string; share: number; value: string }[]; label: string }) {
  const colors: Record<string, string> = { detractors: "bg-ember-600", passives: "bg-ink-300", promoters: "bg-mint-600" };
  return (
    <div className="flex flex-col gap-4">
      <div role="img" aria-label={label} className="flex h-6 gap-0.5 overflow-hidden rounded-[4px]">
        {segments.map((s) => (s.share > 0 ? <div key={s.key} className={colors[s.key]} style={{ width: `${s.share * 100}%` }} /> : null))}
      </div>
      <Legend items={segments.map((s) => ({ label: s.label, value: s.value, swatch: colors[s.key] }))} />
    </div>
  );
}

/** Horizontal bars, one hue, longest first or in the given order, with the value at each bar's end. */
export function BarList({ rows }: { rows: { key: string; label: string; share: number; value: string }[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => (
        <li key={row.key} className="grid grid-cols-[minmax(4rem,9rem)_minmax(0,1fr)_auto] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground">{row.label}</span>
          <span className="h-3 rounded-[4px] bg-ultra-50">
            <span className="block h-full rounded-[4px] bg-ultramarine" style={{ width: `${Math.max(row.share * 100, row.share > 0 ? 2 : 0)}%` }} />
          </span>
          <span className="font-semibold whitespace-nowrap tabular">{row.value}</span>
        </li>
      ))}
    </ul>
  );
}

/** A ratio against 100%: the filled part in Ultramarine on a lighter step of the same hue. */
export function Meter({ ratio, label }: { ratio: number; label: string }) {
  return (
    <span role="img" aria-label={label} className="block h-2 w-full min-w-16 rounded-full bg-ultra-50">
      <span className="block h-full rounded-full bg-ultramarine" style={{ width: `${ratio * 100}%` }} />
    </span>
  );
}
