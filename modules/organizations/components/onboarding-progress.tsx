import { cn } from "@/lib/utils";

export const ONBOARDING_STEPS = 7;

/** "Step x of 7" with slice bars. `label` is the translated progress text. */
export function OnboardingProgress({ current, label }: { current: number; label: string }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: ONBOARDING_STEPS }, (_, i) => (
          <span
            key={i}
            className={cn(
              "slice-sm h-2 flex-1 transition-colors duration-[320ms] ease-[var(--ease-standard)]",
              i < current ? "bg-ultramarine" : "bg-ink-100",
            )}
          />
        ))}
      </div>
    </div>
  );
}
