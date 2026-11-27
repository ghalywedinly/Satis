import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SatisSeal } from "@/components/brand/seal";
import { formatCount } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { oneDecimal } from "../definition";
import { Stars } from "./stars";

/**
 * The white Satis Score pill, the same one brands put on their websites. Full: seal, score,
 * stars, satisfied customers and "verified by Satis". Small: seal, score and satisfied customers.
 * Before 25 ratings it says ratings are being collected.
 */
export function ScorePill({ name, score, satisfied, size = "full", className }: { name: string; score: number | null; satisfied: number; size?: "full" | "small"; className?: string }) {
  const t = useTranslations("score");
  const locale = useLocale() as Locale;
  const label = score === null ? t("badge.collectingLabel", { name }) : t("badge.label", { name, score: oneDecimal(score) });
  const full = size === "full";
  return (
    <span
      role="img"
      aria-label={label}
      className={cn(
        "inline-flex items-center gap-2.5 rounded-full bg-white text-ink shadow-[0_0_0_1px_#ECEEF2]",
        full ? "py-1.5 ps-1.5 pe-4" : "py-1 ps-1 pe-3.5",
        className,
      )}
    >
      <SatisSeal className={full ? "size-10" : "size-7"} />
      {score === null ? (
        <span className="text-sm font-semibold">{t("collecting")}</span>
      ) : full ? (
        <>
          <span className="font-display text-2xl font-extrabold tabular">{oneDecimal(score)}</span>
          <span className="flex flex-col gap-0.5 leading-tight">
            <Stars value={score} size={11} />
            <span className="text-[11px] whitespace-nowrap text-ink-500">
              <b className="font-bold text-ink">{t("badge.satisfied", { count: formatCount(locale, satisfied) })}</b>
              {" · "}
              {t("badge.verified")}
            </span>
          </span>
        </>
      ) : (
        <>
          <span className="font-display text-lg font-extrabold tabular">{oneDecimal(score)}</span>
          <Star aria-hidden strokeWidth={0} className="size-3.5 fill-zest" />
          <span className="text-xs font-bold whitespace-nowrap">{t("badge.satisfied", { count: formatCount(locale, satisfied) })}</span>
        </>
      )}
    </span>
  );
}
