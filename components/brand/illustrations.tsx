import { cn } from "@/lib/utils";

/*
 * Product illustrations built only from brand shapes: rounded cards, slices and the mark.
 * Decorative (aria-hidden) and coloured with token classes, so they follow the palette.
 */

/** Five rating slices in SVG; filled up to `value`, the chosen one highlighted. */
function Slices({ x, y, w, value, chosen = "fill-zest", filled = "fill-ultramarine", empty = "fill-ink-100" }: { x: number; y: number; w: number; value: number; chosen?: string; filled?: string; empty?: string }) {
  const gap = 4;
  const sw = (w - gap * 4) / 5;
  return (
    <g>
      {[1, 2, 3, 4, 5].map((n) => {
        const sx = x + (n - 1) * (sw + gap);
        return <polygon key={n} points={`${sx + 4},${y} ${sx + sw},${y} ${sx + sw - 4},${y + 10} ${sx},${y + 10}`} className={n === value ? chosen : n < value ? filled : empty} />;
      })}
    </g>
  );
}

/** Feedback cards drifting up into a score, drawn for the dark dashboard banner. */
export function FeedbackFlowIllustration({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 320 220" className={cn("pointer-events-none", className)}>
      {/* back card */}
      <g className="motion-safe:animate-float-slow">
        <rect x="150" y="18" width="150" height="92" rx="16" className="fill-ink-700" />
        <rect x="166" y="36" width="70" height="8" rx="4" className="fill-ink-500" />
        <rect x="166" y="52" width="104" height="6" rx="3" className="fill-ink-600" />
        <rect x="166" y="64" width="86" height="6" rx="3" className="fill-ink-600" />
        <Slices x={166} y={84} w={110} value={4} chosen="fill-ultra-300" filled="fill-ultra-500" empty="fill-ink-600" />
      </g>
      {/* front card */}
      <g className="motion-safe:animate-float">
        <rect x="24" y="78" width="176" height="112" rx="18" className="fill-white" />
        <circle cx="50" cy="104" r="12" className="fill-ultra-100" />
        <rect x="70" y="96" width="76" height="8" rx="4" className="fill-ink-200" />
        <rect x="70" y="110" width="50" height="6" rx="3" className="fill-ink-100" />
        <rect x="40" y="130" width="140" height="6" rx="3" className="fill-ink-100" />
        <rect x="40" y="142" width="112" height="6" rx="3" className="fill-ink-100" />
        <Slices x={40} y={164} w={140} value={5} chosen="fill-ember" />
      </g>
      {/* score bubble */}
      <g className="motion-safe:animate-float-slow">
        <rect x="214" y="132" width="86" height="56" rx="16" className="fill-ultramarine" />
        <polygon points="228,188 244,188 226,204" className="fill-ultramarine" />
        <rect x="230" y="148" width="40" height="10" rx="5" className="fill-white" />
        <rect x="230" y="164" width="54" height="6" rx="3" className="fill-ultra-300" />
      </g>
      {/* speed lines */}
      <polygon points="8,30 120,30 112,40 0,40" className="fill-ember" />
      <polygon points="8,48 84,48 76,58 0,58" className="fill-ink-600" />
    </svg>
  );
}

/** A phone with a survey and a QR plate: for empty states that ask to share a survey. */
export function ShareSurveyIllustration({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 260 200" className={cn("pointer-events-none", className)}>
      <polygon points="30,150 230,150 214,176 14,176" className="fill-ultra-100" />
      {/* phone */}
      <rect x="92" y="10" width="96" height="164" rx="18" className="fill-ink" />
      <rect x="99" y="18" width="82" height="148" rx="12" className="fill-white" />
      <rect x="110" y="34" width="44" height="7" rx="3.5" className="fill-ink-200" />
      <rect x="110" y="48" width="60" height="5" rx="2.5" className="fill-ink-100" />
      <Slices x={110} y={66} w={60} value={5} />
      <rect x="110" y="90" width="60" height="30" rx="8" className="fill-ink-50" />
      <rect x="110" y="132" width="60" height="18" rx="9" className="fill-ultramarine" />
      {/* QR plate */}
      <g className="motion-safe:animate-float">
        <rect x="18" y="46" width="64" height="64" rx="12" className="fill-white stroke-ink" strokeWidth="3" />
        {[0, 1, 2].map((r) =>
          [0, 1, 2].map((c) => ((r + c) % 2 === 0 || (r === 1 && c === 1) ? <rect key={`${r}${c}`} x={30 + c * 14} y={58 + r * 14} width="11" height="11" rx="2" className="fill-ink" /> : null)),
        )}
      </g>
      {/* reply bubble */}
      <g className="motion-safe:animate-float-slow">
        <rect x="196" y="40" width="54" height="40" rx="12" className="fill-ember" />
        <polygon points="204,80 218,80 200,94" className="fill-ember" />
        <rect x="206" y="52" width="30" height="6" rx="3" className="fill-ink" />
        <rect x="206" y="64" width="20" height="6" rx="3" className="fill-ink" />
      </g>
    </svg>
  );
}

/** A podium of slices with the mark on top: for the best-performing branch (on Zest). */
export function PodiumIllustration({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 150" className={cn("pointer-events-none", className)}>
      {/* podium steps, slanted like the mark */}
      <polygon points="20,150 72,150 78,104 26,104" className="fill-ink/15" />
      <polygon points="128,150 180,150 186,116 134,116" className="fill-ink/15" />
      <polygon points="70,150 134,150 142,78 78,78" className="fill-ink" />
      {/* the mark floating above the winner */}
      <g className="motion-safe:animate-float">
        <svg x="72" y="0" width="72" height="67" viewBox="8 4 90 84">
          <polygon points="40,4 98,4 68.3,30 10.3,30" className="fill-ink" />
          <polygon points="11.1,34 57.1,34 94.9,58 48.9,58" className="fill-white" />
          <polygon points="66,88 8,88 37.7,62 95.7,62" className="fill-ink" />
        </svg>
      </g>
      {/* sparkle slices */}
      <polygon points="30,40 50,40 46,46 26,46" className="fill-ink" />
      <polygon points="150,30 176,30 172,36 146,36" className="fill-white" />
      <polygon points="160,60 176,60 172,66 156,66" className="fill-ink" />
    </svg>
  );
}

/** A speech bubble with an alert and a low rating: for customers waiting for a follow-up. */
export function AlertIllustration({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 200 150" className={cn("pointer-events-none", className)}>
      <g className="motion-safe:animate-float-slow">
        <rect x="18" y="26" width="128" height="80" rx="18" className="fill-white stroke-ink" strokeWidth="3" />
        <polygon points="40,104 64,104 34,128" className="fill-white stroke-ink" strokeWidth="3" strokeLinejoin="round" />
        <rect x="38" y="46" width="60" height="8" rx="4" className="fill-ink-200" />
        <rect x="38" y="60" width="86" height="6" rx="3" className="fill-ink-100" />
        <Slices x={38} y={80} w={86} value={2} chosen="fill-ember" filled="fill-ember" empty="fill-ink-100" />
      </g>
      <g className="motion-safe:animate-float">
        <circle cx="160" cy="40" r="26" className="fill-ember" />
        <rect x="156" y="24" width="8" height="22" rx="4" className="fill-ink" />
        <circle cx="160" cy="54" r="4.5" className="fill-ink" />
      </g>
      <polygon points="120,130 190,130 184,138 114,138" className="fill-ink" />
      <polygon points="146,118 190,118 184,126 140,126" className="fill-ultramarine" />
    </svg>
  );
}
