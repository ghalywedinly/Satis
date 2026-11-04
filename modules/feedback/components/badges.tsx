import { useLocale, useTranslations } from "next-intl";
import { formatCount } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import type { RatingSentiment, ResponseStatus } from "@/types/database";

const SENTIMENT_STYLES: Record<RatingSentiment, { badge: string; dot: string }> = {
  positive: { badge: "bg-mint-50 text-mint-700", dot: "bg-mint-500" },
  neutral: { badge: "bg-sand-100 text-ink-600", dot: "bg-ink-400" },
  negative: { badge: "bg-ember-50 text-ember-700", dot: "bg-ember-500" },
};

/** The customer's headline score: CSAT out of 5, otherwise NPS out of 10. */
export function ScoreBadge({ csat, nps, sentiment }: { csat: number | null; nps: number | null; sentiment: RatingSentiment | null }) {
  const t = useTranslations("inbox");
  const locale = useLocale() as Locale;
  const label = csat !== null ? t("csat", { score: formatCount(locale, csat) }) : nps !== null ? t("nps", { score: formatCount(locale, nps) }) : t("noScore");
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-control px-2.5 py-1 font-display text-sm font-extrabold tabular",
        sentiment ? SENTIMENT_STYLES[sentiment].badge : "bg-sand-100 text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}

export function SentimentBadge({ sentiment }: { sentiment: RatingSentiment | null }) {
  const t = useTranslations("inbox.sentiment");
  if (!sentiment) return null;
  return (
    <span title={t("hint")} className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", SENTIMENT_STYLES[sentiment].badge)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", SENTIMENT_STYLES[sentiment].dot)} />
      {t(sentiment)}
    </span>
  );
}

export function StatusBadge({ status }: { status: ResponseStatus }) {
  const t = useTranslations("inbox.status");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "new" ? "bg-ultra-50 text-ultra-700" : status === "in_progress" ? "bg-grape-50 text-grape-600" : "bg-sand-100 text-ink-600",
      )}
    >
      {t(status)}
    </span>
  );
}

export function TagChip({ name, children }: { name: string; children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-white px-2.5 py-0.5 text-xs font-medium text-ink-700">
      <bdi>{name}</bdi>
      {children}
    </span>
  );
}
