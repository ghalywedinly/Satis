import { useId } from "react";
import { cn } from "@/lib/utils";

/** The seal's scalloped outline in a 48×48 box (24 bumps). */
const SEAL_POINTS =
  "47.5,24.0 46.4,26.0 44.2,27.6 42.8,29.0 43.3,31.0 44.4,33.5 44.4,35.8 42.4,36.9 39.7,37.2 37.8,37.8 37.2,39.7 36.9,42.4 35.8,44.4 33.5,44.4 31.0,43.3 29.0,42.8 27.6,44.2 26.0,46.4 24.0,47.5 22.0,46.4 20.4,44.2 19.0,42.8 17.0,43.3 14.5,44.4 12.3,44.4 11.1,42.4 10.8,39.7 10.2,37.8 8.3,37.2 5.6,36.9 3.6,35.8 3.6,33.5 4.7,31.0 5.2,29.0 3.8,27.6 1.6,26.0 0.5,24.0 1.6,22.0 3.8,20.4 5.2,19.0 4.7,17.0 3.6,14.5 3.6,12.2 5.6,11.1 8.3,10.8 10.2,10.2 10.8,8.3 11.1,5.6 12.2,3.6 14.5,3.6 17.0,4.7 19.0,5.2 20.4,3.8 22.0,1.6 24.0,0.5 26.0,1.6 27.6,3.8 29.0,5.2 31.0,4.7 33.5,3.6 35.7,3.6 36.9,5.6 37.2,8.3 37.8,10.2 39.7,10.8 42.4,11.1 44.4,12.3 44.4,14.5 43.3,17.0 42.8,19.0 44.2,20.4 46.4,22.0";
const S_MARK = ["40,4 98,4 68.3,30 10.3,30", "11.1,34 57.1,34 94.9,58 48.9,58", "66,88 8,88 37.7,62 95.7,62"];
/** Ring text is part of the seal artwork (a brand asset), not translatable UI copy. */
const RING_TEXT = "VERIFIED BY SATIS · SATIS SCORE · ";

/**
 * The Satis seal: a Zest scalloped badge with the Ink S-mark. Decorative; describe the score
 * in nearby text. With `ring`, the verification text runs around the edge and turns slowly
 * (still when reduced motion is on).
 */
export function SatisSeal({ ring = false, className }: { ring?: boolean; className?: string }) {
  const id = useId();
  return (
    <svg viewBox="0 0 48 48" aria-hidden className={cn("size-12 shrink-0", className)}>
      <polygon points={SEAL_POINTS} fill="#FFCF28" />
      {ring && (
        <>
          <defs>
            <path id={id} d="M24,24 m-16.2,0 a16.2,16.2 0 1,1 32.4,0 a16.2,16.2 0 1,1 -32.4,0" />
          </defs>
          <g className="seal-ring">
            <text direction="ltr" style={{ direction: "ltr" }} className="font-display" fontWeight={800} fontSize={3.1} fill="#0B0D12" letterSpacing={0.5}>
              <textPath href={`#${id}`} textLength={100} lengthAdjust="spacing">
                {RING_TEXT}
              </textPath>
            </text>
          </g>
        </>
      )}
      <g transform={ring ? "translate(15 16.2) scale(0.17)" : "translate(11.5 13.4) scale(0.23)"} fill="#0B0D12">
        {S_MARK.map((points) => (
          <polygon key={points} points={points} />
        ))}
      </g>
    </svg>
  );
}
