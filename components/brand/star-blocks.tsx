import { cn } from "@/lib/utils";

const STAR = "M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3 6.1 20.6l1.3-6.6L2.5 9.4l6.6-.8z";

/**
 * Five square star blocks filled in Zest up to the score (4.7 fills four and 70% of the fifth).
 * Decorative: pass the score as text nearby, or give the wrapper an accessible label.
 * `onInk` uses the dark empty colour for Ink backgrounds.
 */
export function StarBlocks({ score, size = "md", onInk = false, className }: { score: number; size?: "sm" | "md" | "lg"; onInk?: boolean; className?: string }) {
  const box = { sm: "size-5 rounded-[5px]", md: "size-7 rounded-[7px]", lg: "size-9 rounded-[8px]" }[size];
  const icon = { sm: "size-2.5", md: "size-3.5", lg: "size-4.5" }[size];
  return (
    <span aria-hidden className={cn("flex gap-1", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, score - (n - 1)));
        return (
          <span key={n} className={cn("relative inline-flex items-center justify-center overflow-hidden", box, onInk ? "bg-ink-600" : "bg-linen")}>
            <span className="absolute inset-y-0 start-0 bg-zest" style={{ width: `${Math.round(fill * 100)}%` }} />
            <svg viewBox="0 0 24 24" className={cn("relative", icon)}>
              <path d={STAR} fill="#0B0D12" />
            </svg>
          </span>
        );
      })}
    </span>
  );
}
