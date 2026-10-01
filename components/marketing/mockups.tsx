import { cn } from "@/lib/utils";

/**
 * Illustrations of the product, drawn in code so they stay sharp, follow the brand tokens
 * and flip correctly in Arabic. Decorative: hidden from screen readers unless labelled.
 */

/** A phone with a notch. Children render as the screen. */
export function PhoneFrame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div aria-hidden className={cn("rounded-[38px] border-[3px] border-ink bg-ink p-2", className)}>
      <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] bg-sand text-ink">
        <div className="absolute start-1/2 top-2 z-10 h-5 w-20 -translate-x-1/2 rounded-full bg-ink rtl:translate-x-1/2" />
        {children}
      </div>
    </div>
  );
}

/** A browser window with three dots and an address bar. */
export function BrowserFrame({ children, address, className }: { children: React.ReactNode; address: string; className?: string }) {
  return (
    <div aria-hidden className={cn("overflow-hidden rounded-[20px] border-[3px] border-ink bg-white", className)}>
      <div className="flex items-center gap-3 border-b-[3px] border-ink bg-sand-100 px-4 py-2.5">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-ember" />
          <span className="size-2.5 rounded-full bg-zest" />
          <span className="size-2.5 rounded-full bg-mint" />
        </div>
        <bdi dir="ltr" className="flex-1 truncate rounded-full bg-white px-3 py-1 text-center text-xs text-muted-foreground">
          {address}
        </bdi>
      </div>
      {children}
    </div>
  );
}

/** Rising line, for NPS and trend cards. */
export function Sparkline({ className, color = "#0FA968" }: { className?: string; color?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 160 40" className={cn("h-auto w-full", className)}>
      <polyline
        points="0,36 18,32 32,34 48,26 62,28 78,20 94,22 110,14 126,16 142,8 160,4"
        fill="none"
        stroke={color}
        strokeWidth={2.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The brand's bar chart: slanted Ultramarine bars, the latest in Zest. Heights in percent. */
export function SlantedBars({ heights, className }: { heights: number[]; className?: string }) {
  return (
    <div aria-hidden className={cn("flex h-24 items-end gap-1.5", className)}>
      {heights.map((h, i) => (
        <div
          key={i}
          className={cn("flex-1 -skew-x-[18deg] rounded-t-[3px]", i === heights.length - 1 ? "bg-zest" : "bg-ultramarine")}
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

/** A small pill bar with a label and value, as in the sentiment card. */
export function PillBar({ label, value, ratio, color }: { label: string; value: string; ratio: number; color: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-semibold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-ink-100">
        <div className={cn("h-full rounded-full", color)} style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

/** Five slanted slices; filled up to `value`, the chosen one in Zest. */
export function MiniRating({ value, dark = false, className }: { value: number; dark?: boolean; className?: string }) {
  return (
    <div aria-hidden className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn("slice-md h-3.5 flex-1", n === value ? "bg-zest" : n < value ? "bg-ultramarine" : dark ? "bg-ink-700" : "bg-ink-100")}
        />
      ))}
    </div>
  );
}
