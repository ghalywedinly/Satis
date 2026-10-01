import { cn } from "@/lib/utils";

const TOP = "40,4 98,4 68.3,30 10.3,30";
const MID = "11.1,34 57.1,34 94.9,58 48.9,58";
const BOT = "66,88 8,88 37.7,62 95.7,62";

/** Slanted plate behind a word or score. Zest is reserved for delight / top scores. */
export function SliceHighlight({
  children,
  tone = "zest",
  className,
}: {
  children: React.ReactNode;
  tone?: "zest" | "ink" | "ultra" | "ember";
  className?: string;
}) {
  const tones = {
    zest: "bg-zest text-ink",
    ink: "bg-ink text-sand",
    ultra: "bg-ultramarine text-white",
    ember: "bg-ember text-ink",
  } as const;
  return <span className={cn("slice inline-block px-[0.4em] font-bold", tones[tone], className)}>{children}</span>;
}

/** 1–5 rating drawn in slices. Filled slices are Ultramarine; the selected answer is Zest. */
export function RatingSlices({
  value,
  max = 5,
  size = "md",
  onDark = false,
  label,
  onChange,
  className,
}: {
  value: number;
  max?: number;
  size?: "sm" | "md" | "lg";
  onDark?: boolean;
  /** Accessible name for the scale, e.g. the question text (translated by the caller). */
  label: string;
  onChange?: (v: number) => void;
  className?: string;
}) {
  const h = { sm: "h-2.5", md: "h-3.5", lg: "h-[18px]" }[size];
  const clip = { sm: "slice-sm", md: "slice-md", lg: "slice-lg" }[size];
  return (
    <div role={onChange ? "radiogroup" : "img"} aria-label={label} className={cn("flex gap-1", className)}>
      {Array.from({ length: max }, (_, i) => {
        const n = i + 1;
        const color = n === value ? "bg-zest" : n < value ? "bg-ultramarine" : onDark ? "bg-ink-700" : "bg-ink-100";
        const slice = <span className={cn("block transition-colors duration-[140ms] ease-[var(--ease-standard)]", h, clip, color)} />;
        if (!onChange) return <div key={n} className="flex-1">{slice}</div>;
        // The visible slice is thin; the button's vertical padding gives a 44px-class touch target.
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={n === value}
            aria-label={`${n}`}
            onClick={() => onChange(n)}
            className="-my-4 flex-1 cursor-pointer rounded-xs py-4 outline-none focus-visible:shadow-focus"
          >
            {slice}
          </button>
        );
      })}
    </div>
  );
}

/** The mark at huge scale, cropped to bleed off an edge. Place inside a relative, overflow-hidden parent. */
export function Supergraphic({
  colors = ["#2B3AF3", "#FFCF28", "#2B3AF3"],
  viewBox = "34 0 64 92",
  className,
}: {
  colors?: [string, string, string];
  viewBox?: string;
  className?: string;
}) {
  return (
    <svg aria-hidden viewBox={viewBox} preserveAspectRatio="xMinYMid slice" className={cn("pointer-events-none absolute", className)}>
      <polygon points={TOP} fill={colors[0]} />
      <polygon points={MID} fill={colors[1]} />
      <polygon points={BOT} fill={colors[2]} />
    </svg>
  );
}

/** White product card with a 3px ink outline, used floating over Ember or Ink grounds (marketing only). */
export function OutlinedCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-[24px] border-[3px] border-ink bg-white p-5 text-ink", className)}>{children}</div>;
}

/** Pill tag with ink outline, for floating labels such as "Top rated store". */
export function OutlinedPill({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border-2 border-ink bg-white py-1.5 ps-2.5 pe-3.5 text-sm font-semibold text-ink", className)}>
      {children}
    </span>
  );
}

/** Speed lines: slices of decreasing length, for dividers and section openers. */
export function SpeedLines({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex flex-col gap-2.5", className)}>
      <div className="slice-lg h-8 w-full bg-ink" />
      <div className="slice-lg h-8 w-[74%] bg-ink" />
      <div className="slice-lg h-8 w-[52%] bg-ultramarine" />
    </div>
  );
}
