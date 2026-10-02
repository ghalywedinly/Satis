import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import type { InboxRow } from "../queries";
import { AiThemeChips } from "@/modules/ai/components/ai-themes";
import { ScoreBadge, SentimentBadge, StatusBadge, TagChip } from "./badges";

export function ResponseList({ rows, backQuery }: { rows: InboxRow[]; backQuery: string }) {
  const t = useTranslations("inbox");
  const locale = useLocale() as Locale;
  return (
    <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-white">
      {rows.map((row) => (
        <li key={row.id}>
          <Link
            // The filters travel along so "Back" returns to the same view.
            href={`/inbox/${row.id}${backQuery}`}
            className="flex gap-4 rounded-card px-4 py-4 outline-none hover:bg-sand-50 focus-visible:shadow-focus sm:px-5"
          >
            <div className="flex w-3 shrink-0 justify-center pt-2.5">
              {!row.is_read && (
                <span className="size-2.5 rounded-full bg-ultramarine">
                  <span className="sr-only">{t("unread")}</span>
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <ScoreBadge csat={row.csat_score} nps={row.nps_score} sentiment={row.rating_sentiment} />
                <SentimentBadge sentiment={row.rating_sentiment} />
                <StatusBadge status={row.status} />
                {row.is_important && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-ember-700">
                    <Star aria-hidden strokeWidth={1.75} className="size-4 fill-ember-500 text-ember-500" />
                    {t("important")}
                  </span>
                )}
              </div>
              <p dir="auto" className={cn("line-clamp-2 text-start", row.comment_text ? (row.is_read ? "text-ink-700" : "font-semibold text-ink") : "text-muted-foreground")}>
                {row.comment_text ?? t("noComment")}
              </p>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <span>{row.location?.name}</span>
                <span aria-hidden>·</span>
                <span>{row.survey?.name}</span>
                <span aria-hidden>·</span>
                <time dateTime={row.submitted_at}>{formatDate(locale, row.submitted_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</time>
              </div>
              {row.analysis && <AiThemeChips praise={row.analysis.praise_themes} complaints={row.analysis.complaint_themes} />}
              {row.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {row.tags.map(({ tag }) => tag && <TagChip key={tag.id} name={tag.name} />)}
                </div>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
