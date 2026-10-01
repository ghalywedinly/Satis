import { cn } from "@/lib/utils";

const TOP = "40,4 98,4 68.3,30 10.3,30";
const MID = "11.1,34 57.1,34 94.9,58 48.9,58";
const BOT = "66,88 8,88 37.7,62 95.7,62";

/** The wordmark is part of the logo (a brand asset), not translatable UI copy. */
const WORDMARK = { en: "Satis", ar: "ساتيس" } as const;

export type MarkTone = "ink" | "ink-ultra" | "ultra" | "sand" | "sand-zest" | "white" | "white-zest";

const TONES: Record<MarkTone, { band: string; mid: string }> = {
  ink: { band: "#0B0D12", mid: "#0B0D12" },
  "ink-ultra": { band: "#0B0D12", mid: "#2B3AF3" },
  ultra: { band: "#2B3AF3", mid: "#2B3AF3" },
  sand: { band: "#FAF8F4", mid: "#FAF8F4" },
  "sand-zest": { band: "#FAF8F4", mid: "#FFCF28" },
  white: { band: "#FFFFFF", mid: "#FFFFFF" },
  "white-zest": { band: "#FFFFFF", mid: "#FFCF28" },
};

/** The Satis "sliced fold" S. Three slices; the middle slice may carry an accent. Aspect 90:84. */
export function SatisMark({ tone = "ink", className, title = "Satis" }: { tone?: MarkTone; className?: string; title?: string }) {
  const t = TONES[tone];
  return (
    <svg viewBox="8 4 90 84" role="img" aria-label={title} className={cn("h-6 w-auto shrink-0", className)}>
      <polygon points={TOP} fill={t.band} />
      <polygon points={MID} fill={t.mid} />
      <polygon points={BOT} fill={t.band} />
    </svg>
  );
}

/**
 * Lockup: mark + wordmark. Mark height = 0.72 × font-size, gap = 0.22 × font-size.
 * locale="ar" renders ساتيس in Readex Pro; in RTL the mark leads on the right automatically.
 * locale="bilingual" stacks Latin over Arabic.
 */
export function SatisLogo({
  tone = "ink",
  locale = "en",
  size = 32,
  className,
}: {
  tone?: MarkTone;
  locale?: "en" | "ar" | "bilingual";
  size?: number;
  className?: string;
}) {
  const color = TONES[tone].band;
  const mark = <SatisMark tone={tone} className="w-auto" />;
  if (locale === "bilingual") {
    return (
      <span className={cn("inline-flex items-center", className)} style={{ gap: size * 0.4, color }}>
        <span style={{ height: size * 1.3, display: "inline-flex" }}>{<SatisMark tone={tone} className="h-full w-auto" />}</span>
        <span className="flex flex-col" style={{ gap: size * 0.12 }}>
          <span className="font-display font-bold leading-[0.9]" style={{ fontSize: size, letterSpacing: "-0.04em" }} lang="en">{WORDMARK.en}</span>
          <span className="font-arabic font-semibold leading-none" style={{ fontSize: size * 0.64 }} dir="rtl" lang="ar">{WORDMARK.ar}</span>
        </span>
      </span>
    );
  }
  const ar = locale === "ar";
  return (
    <span dir={ar ? "rtl" : undefined} className={cn("inline-flex items-center", className)} style={{ gap: size * 0.22, color }}>
      <span style={{ height: size * 0.72, display: "inline-flex" }}>{mark && <SatisMark tone={tone} className="h-full w-auto" />}</span>
      <span
        className={cn("font-bold leading-none", ar ? "font-arabic" : "font-display")}
        style={{ fontSize: size, letterSpacing: ar ? 0 : "-0.04em" }}
      >
        {ar ? WORDMARK.ar : WORDMARK.en}
      </span>
    </span>
  );
}
