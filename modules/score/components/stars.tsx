import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Five stars for a customer-facing rating: filled Zest up to the value (4.7 fills four and 70%
 * of the fifth), empty linen, or ink-600 on Ink. Decorative: give the value as text nearby.
 */
export function Stars({ value, size = 16, onInk = false, className }: { value: number; size?: number; onInk?: boolean; className?: string }) {
  return (
    <span aria-hidden className={cn("inline-flex gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)));
        return (
          <span key={n} className="relative inline-flex" style={{ width: size, height: size }}>
            <Star strokeWidth={0} className={cn("absolute inset-0 size-full", onInk ? "fill-ink-600" : "fill-linen")} />
            {fill > 0 && (
              <span className="absolute inset-y-0 start-0 overflow-hidden" style={{ width: `${Math.round(fill * 100)}%` }}>
                <Star strokeWidth={0} className="fill-zest" style={{ width: size, height: size }} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}
