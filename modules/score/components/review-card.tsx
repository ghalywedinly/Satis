import { useLocale, useTranslations } from "next-intl";
import { SatisSeal } from "@/components/brand/seal";
import { formatDate } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import type { Review } from "../definition";
import { BrandAvatar } from "./brand-avatar";
import { Stars } from "./stars";

/** One published review: who (first name, city, branch), stars, the comment and the brand's reply. */
export function ReviewCard({ review, brand }: { review: Review; brand: string }) {
  const t = useTranslations("score");
  const locale = useLocale() as Locale;
  const name = review.name ?? t("profile.anonymous");
  const where = [review.city, review.location].filter(Boolean).join(" · ");
  return (
    <article className="flex flex-col gap-3 rounded-card border border-ink-100 bg-white p-5 sm:p-6">
      <header className="flex items-start gap-3">
        <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-full bg-ink-50 font-display text-lg font-extrabold">
          {Array.from(name)[0]}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate font-sans text-base font-bold" dir="auto">
            {name}
          </h3>
          <p className="truncate text-[13px] text-ink-500">{where}</p>
        </div>
        <time dateTime={review.at} className="shrink-0 text-[13px] text-ink-500">
          {formatDate(locale, review.at, { day: "numeric", month: "long", year: "numeric" })}
        </time>
      </header>
      <div className="flex flex-wrap items-center gap-2.5">
        <Stars value={review.rating} size={16} />
        <span className="sr-only">{t("starsLabel", { score: String(review.rating) })}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-ink-50 py-0.5 ps-0.5 pe-2.5 text-xs font-semibold">
          <SatisSeal className="size-5" />
          {t("profile.verifiedVisit")}
        </span>
      </div>
      <p dir="auto" className="text-start leading-relaxed whitespace-pre-line">
        {review.comment}
      </p>
      {review.reply && (
        <div className="flex flex-col gap-1.5 rounded-control border-s-[3px] border-ember bg-ink-50 px-4 py-3">
          <p className="flex flex-wrap items-center gap-2 text-[13px]">
            <BrandAvatar name={brand} className="size-6 rounded-[6px] text-xs" />
            <b className="font-bold">{t("profile.replyFrom", { name: brand })}</b>
            {review.replyAt && <span className="text-ink-500">{formatDate(locale, review.replyAt, { day: "numeric", month: "long", year: "numeric" })}</span>}
          </p>
          <p dir="auto" className="text-start text-[15px] leading-relaxed whitespace-pre-line">
            {review.reply}
          </p>
        </div>
      )}
    </article>
  );
}
