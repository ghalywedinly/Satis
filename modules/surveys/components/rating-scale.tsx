"use client";

import { useState } from "react";
import { Heart, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SurveyTheme } from "../definition";
import { accentStyle } from "./survey-theme";

const SCORES = [1, 2, 3, 4, 5] as const;

/**
 * A 1–5 rating in one of the survey's styles. Every style answers the same number, so analytics
 * never depend on the look. Each score is a radio button named by its number.
 */
export function RatingScale({
  value,
  onChange,
  ratingStyle,
  accent,
  dark,
  label,
  size = "lg",
}: {
  value: number;
  onChange?: (value: number) => void;
  ratingStyle: SurveyTheme["ratingStyle"];
  accent: SurveyTheme["accent"];
  dark: boolean;
  /** Accessible name for the scale (the question). */
  label: string;
  /** "lg" on the survey; smaller sizes for previews in the builder. */
  size?: "sm" | "md" | "lg";
}) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  const style = accentStyle(accent, dark);
  const icon = { sm: "size-3.5", md: "size-6", lg: "size-11" }[size];

  return (
    <div
      role={onChange ? "radiogroup" : "img"}
      aria-label={label}
      onPointerLeave={() => setHover(null)}
      className={cn(
        "flex",
        ratingStyle === "slices" ? (size === "sm" ? "gap-0.5" : "gap-1") : ratingStyle === "numbers" ? (size === "sm" ? "gap-0.5" : "gap-2") : "justify-between gap-0.5",
      )}
    >
      {SCORES.map((n) => {
        const selected = n === value;
        const visual =
          ratingStyle === "stars" ? (
            <Star
              strokeWidth={1.5}
              className={cn(
                icon,
                "transition-[transform,color,fill] duration-[200ms] ease-[var(--ease-pop)]",
                n <= shown ? "fill-zest text-zest-600" : dark ? "text-ink-500" : "text-ink-200",
                selected && "scale-110",
              )}
            />
          ) : ratingStyle === "hearts" ? (
            <Heart
              strokeWidth={1.5}
              className={cn(
                icon,
                "transition-[transform,color,fill] duration-[200ms] ease-[var(--ease-pop)]",
                n <= shown ? style.icon : dark ? "text-ink-500" : "text-ink-200",
                selected && "scale-110",
              )}
            />
          ) : ratingStyle === "faces" ? (
            <Face score={n} active={selected || hover === n} dark={dark} className={{ sm: "size-4", md: "size-7", lg: "size-12" }[size]} />
          ) : ratingStyle === "numbers" ? (
            <span
              className={cn(
                "flex w-full items-center justify-center font-display font-extrabold transition-colors duration-[140ms]",
                { sm: "h-4 rounded-[3px] text-[8px]", md: "h-7 rounded-[6px] text-sm", lg: "h-14 rounded-control text-2xl" }[size],
                selected ? style.solid : dark ? "bg-white/10 text-sand hover:bg-white/15" : "bg-ink-50 text-ink hover:bg-ink-100",
              )}
            >
              {n}
            </span>
          ) : (
            <span
              className={cn(
                "block transition-colors duration-[140ms] ease-[var(--ease-standard)]",
                { sm: "slice-sm h-1.5", md: "slice-md h-3", lg: "slice-lg h-[18px]" }[size],
                selected ? "bg-zest" : n < shown ? style.bar : dark ? "bg-ink-700" : "bg-ink-100",
              )}
            />
          );

        if (!onChange) return <div key={n} className="flex-1">{visual}</div>;
        return (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${n}`}
            onClick={() => onChange(n)}
            onPointerEnter={() => setHover(n)}
            className={cn(
              "flex flex-1 cursor-pointer justify-center rounded-sm outline-none focus-visible:shadow-focus",
              // Thin slices get a taller hit area so they stay easy to tap.
              ratingStyle === "slices" && "-my-4 block py-4",
            )}
          >
            {visual}
          </button>
        );
      })}
    </div>
  );
}

/** Mouths from unhappy to delighted, drawn in a 48×48 box. */
const MOUTHS = ["M15 35 Q24 25 33 35", "M16 33 Q24 28 32 33", "M16 31 L32 31", "M16 29 Q24 35 32 29", "M14 27 Q24 41 34 27 Z"];
const FACE_FILLS = ["fill-ember-600", "fill-ember", "fill-zest", "fill-mint-500", "fill-mint-600"];

/** A drawn face, not an emoji: the same on every phone and in the brand's colours. */
function Face({ score, active, dark, className }: { score: number; active: boolean; dark: boolean; className: string }) {
  const ink = active ? "stroke-ink fill-ink" : dark ? "stroke-ink-300 fill-ink-300" : "stroke-ink-400 fill-ink-400";
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn(className, "transition-transform duration-[200ms] ease-[var(--ease-pop)]", active && "scale-115")}
    >
      <circle cx="24" cy="24" r="22" className={active ? FACE_FILLS[score - 1] : dark ? "fill-ink-700" : "fill-sand-100"} />
      {score === 1 && (
        <path d="M12 15 L20 18 M36 15 L28 18" strokeWidth="2.5" strokeLinecap="round" className={cn(ink, "fill-none")} />
      )}
      <circle cx="17" cy="21" r="2.8" className={cn(ink, "stroke-0")} />
      <circle cx="31" cy="21" r="2.8" className={cn(ink, "stroke-0")} />
      <path d={MOUTHS[score - 1]} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={cn(ink, score === 5 ? "" : "fill-none")} />
    </svg>
  );
}
