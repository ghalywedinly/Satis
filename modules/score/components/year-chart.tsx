import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { oneDecimal, type ScoreProfile } from "../definition";

const W = 320;
const H = 120;
const PAD = 10;

/**
 * The score month by month over the last year: an Ultramarine line, the latest month marked in
 * Zest. Time reads left to right in both languages. A table carries the numbers for screen readers.
 */
export function YearChart({ months }: { months: ScoreProfile["months"] }) {
  const t = useTranslations("score.profile");
  const locale = useLocale() as Locale;
  const points = months.map((m, i) => ({ ...m, x: PAD + (i * (W - 2 * PAD)) / Math.max(months.length - 1, 1) })).filter((m) => m.score !== null) as (ScoreProfile["months"][number] & { x: number; score: number })[];
  if (points.length === 0) return <p className="text-sm text-ink-500">{t("noYear")}</p>;

  const values = points.map((p) => p.score);
  const lo = Math.max(1, Math.floor((Math.min(...values) - 0.2) * 2) / 2);
  const hi = Math.min(5, Math.ceil((Math.max(...values) + 0.2) * 2) / 2);
  const y = (v: number) => H - PAD - ((v - lo) / Math.max(hi - lo, 0.5)) * (H - 2 * PAD);
  const last = points[points.length - 1];
  const monthName = (m: string) => formatDate(locale, `${m}T12:00:00Z`, { month: "short" });

  return (
    <div className="flex flex-col gap-2">
      <svg viewBox={`0 0 ${W} ${H + 18}`} aria-hidden className="h-auto w-full" direction="ltr">
        {[lo, hi].map((v) => (
          <g key={v}>
            <line x1={PAD} x2={W - PAD} y1={y(v)} y2={y(v)} stroke="#ECEEF2" strokeDasharray="3 4" />
            <text x={W - PAD} y={y(v) - 4} textAnchor="end" fontSize={9} fill="#8A94A6">
              {oneDecimal(v)}
            </text>
          </g>
        ))}
        <polyline points={points.map((p) => `${p.x},${y(p.score)}`).join(" ")} fill="none" stroke="#2B3AF3" strokeWidth={2} strokeLinejoin="round" />
        {points.map((p) => (
          <circle key={p.month} cx={p.x} cy={y(p.score)} r={p === last ? 5 : 3} fill={p === last ? "#FFCF28" : "#2B3AF3"} stroke={p === last ? "#0B0D12" : "none"} strokeWidth={1.5} />
        ))}
        <text x={PAD} y={H + 14} fontSize={9} fill="#8A94A6">
          {monthName(months[0].month)}
        </text>
        <text x={W - PAD} y={H + 14} fontSize={9} fill="#8A94A6" textAnchor="end">
          {monthName(months[months.length - 1].month)}
        </text>
      </svg>
      <table className="sr-only">
        <caption>{t("yearSummary")}</caption>
        <thead>
          <tr>
            <th scope="col">{t("month")}</th>
            <th scope="col">{t("monthScore")}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.month}>
              <th scope="row">{formatDate(locale, `${p.month}T12:00:00Z`, { month: "long", year: "numeric" })}</th>
              <td>{oneDecimal(p.score)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
