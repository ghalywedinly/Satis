import { cn } from "@/lib/utils";

const TONES = ["bg-zest text-ink", "bg-ink text-zest", "bg-ember text-ink", "bg-mint text-ink", "bg-ultramarine text-white"];

/** A brand's first letter on one of the brand colours, picked from its name so it stays the same. */
export function BrandAvatar({ name, className }: { name: string; className?: string }) {
  const letter = Array.from(name.trim())[0] ?? "";
  const tone = TONES[Array.from(name).reduce((a, c) => a + c.codePointAt(0)!, 0) % TONES.length];
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-[12px] font-display font-extrabold", tone, className)}>
      {letter}
    </span>
  );
}
