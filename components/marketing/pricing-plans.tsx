"use client";

import { useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatCount, formatNumber, formatSar } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { COMPARE, PLANS, SEGMENTS, VISITS_GROWTH, YEARLY_MONTHS, visitsGrowthPrice, type Cell, type Segment } from "./plans";

const sar = (locale: Locale, riyals: number) => formatSar(locale, Math.round(riyals * 100));

/**
 * The pricing page's interactive part: choose a kind of business and monthly or yearly billing;
 * plan cards and the comparison table follow. Visits Growth prices by number of locations.
 */
export function PricingPlans() {
  const t = useTranslations("pricing");
  const locale = useLocale() as Locale;
  const [segment, setSegment] = useState<Segment>("visits");
  const [yearly, setYearly] = useState(false);
  const [locations, setLocations] = useState<number>(VISITS_GROWTH.start);
  const plans = PLANS[segment];

  const cellText = (cell: Cell) => {
    if (typeof cell === "number") return formatCount(locale, cell);
    if (cell === "unlimited") return t("compare.unlimited");
    if (cell === "from3") return t("rows.from3");
    if (cell === "tenPlus") return t("rows.tenPlus");
    return null;
  };

  return (
    <div className="flex min-w-0 flex-col gap-24">
      <section aria-labelledby="plans-heading" className="flex min-w-0 flex-col gap-6">
        <h2 id="plans-heading" className="sr-only">
          {t("segmentsLabel")}
        </h2>
        <div className="flex flex-col items-center gap-5">
          <div role="tablist" aria-label={t("segmentsLabel")} className="flex flex-wrap justify-center gap-1.5 rounded-[18px] bg-ink-50 p-1.5">
            {SEGMENTS.map((s) => {
              const on = s === segment;
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={on}
                  onClick={() => setSegment(s)}
                  className={cn(
                    "flex min-w-44 flex-col items-center gap-0.5 rounded-[13px] px-5 py-3 outline-none transition-colors duration-[140ms] ease-[var(--ease-standard)] focus-visible:shadow-focus",
                    on ? "bg-ink text-white" : "text-ink hover:bg-white",
                  )}
                >
                  <span className="text-base font-bold">{t(`segments.${s}.name`)}</span>
                  <span className={cn("text-xs", on ? "text-ink-300" : "text-ink-500")}>{t(`segments.${s}.sub`)}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-[15px]">
            <span className={yearly ? "text-ink-500" : "font-bold"}>{t("billing.monthly")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={yearly}
              aria-label={t("billing.label")}
              onClick={() => setYearly(!yearly)}
              className="flex h-[30px] w-[52px] rounded-full bg-zest p-1 outline-none focus-visible:shadow-focus"
            >
              <span className={cn("size-[22px] rounded-full bg-ink transition-transform duration-[200ms] ease-[var(--ease-standard)]", yearly && "translate-x-[22px] rtl:-translate-x-[22px]")} />
            </button>
            <span className={yearly ? "font-bold" : "text-ink-500"}>{t("billing.yearly")}</span>
            <span className="rounded-full bg-mint px-2.5 py-0.5 text-xs font-bold text-ink">{t("billing.save")}</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan, i) => {
            const ink = !!plan.popular;
            const monthly = plan.perLocation ? visitsGrowthPrice(locations) : plan.price;
            const shown = monthly === null ? null : yearly && monthly > 0 ? (monthly * YEARLY_MONTHS) / 12 : monthly;
            const name = t(`plans.${segment}.${plan.tier}.name`);
            const note =
              yearly && monthly
                ? t("billing.yearlyNote", { total: sar(locale, monthly * YEARLY_MONTHS), full: sar(locale, monthly * 12) })
                : plan.perLocation
                  ? t(`plans.${segment}.${plan.tier}.note`, { base: sar(locale, VISITS_GROWTH.base), extra: sar(locale, VISITS_GROWTH.perExtra) })
                  : t(`plans.${segment}.${plan.tier}.note`, { base: "", extra: "" });
            const previous = i > 0 ? t(`plans.${segment}.${plans[i - 1].tier}.name`) : null;
            return (
              <article
                key={plan.tier}
                aria-label={name}
                className={cn(
                  "flex flex-col gap-4 rounded-[28px] p-6",
                  ink ? "bg-ink text-white drop-shadow-[12px_12px_0_#FFCF28] rtl:drop-shadow-[-12px_12px_0_#FFCF28]" : "border border-ink-100 bg-white",
                )}
              >
                <div className="flex min-h-7 items-center gap-2">
                  <h3 className="flex-1 font-sans text-lg font-bold">{name}</h3>
                  {ink && <span className="rounded-full bg-zest px-2.5 py-0.5 text-xs font-bold text-ink">{t("popular")}</span>}
                </div>
                <p className={cn("-mt-3 text-sm", ink ? "text-ink-300" : "text-ink-500")}>{t(`plans.${segment}.${plan.tier}.for`)}</p>
                <div className="flex min-h-24 flex-col gap-1">
                  <p className="flex flex-wrap items-baseline gap-x-1.5">
                    {plan.from && <span className="text-[15px] font-semibold">{t("billing.from")}</span>}
                    {shown === null ? (
                      <span className="font-display text-4xl leading-tight font-extrabold tracking-tight">{t("billing.custom")}</span>
                    ) : (
                      t.rich("billing.amount", {
                        amount: formatNumber(locale, Math.round(shown)),
                        big: (chunks) => <span className="font-display text-5xl leading-tight font-extrabold tracking-tight tabular">{chunks}</span>,
                        small: (chunks) => <span className="text-[15px] font-semibold">{chunks}</span>,
                      })
                    )}
                  </p>
                  <p className={cn("text-[13px] leading-relaxed", ink ? "text-ink-300" : "text-ink-500")}>{note}</p>
                </div>
                {plan.perLocation && (
                  <div className="flex items-center gap-2.5 rounded-control bg-ink-800 px-2.5 py-2">
                    <span className="flex-1 text-sm">{t("branches.label")}</span>
                    <button
                      type="button"
                      aria-label={t("branches.less")}
                      disabled={locations <= VISITS_GROWTH.min}
                      onClick={() => setLocations(Math.max(VISITS_GROWTH.min, locations - 1))}
                      className="flex size-8 items-center justify-center rounded-[8px] bg-ink-600 outline-none hover:bg-ink-500 focus-visible:shadow-focus disabled:opacity-40"
                    >
                      <Minus aria-hidden strokeWidth={1.75} className="size-4" />
                    </button>
                    <output aria-live="polite" className="min-w-10 text-center font-display text-lg font-extrabold tabular">
                      {formatCount(locale, locations)}
                    </output>
                    <button
                      type="button"
                      aria-label={t("branches.more")}
                      disabled={locations >= VISITS_GROWTH.max}
                      onClick={() => setLocations(Math.min(VISITS_GROWTH.max, locations + 1))}
                      className="flex size-8 items-center justify-center rounded-[8px] bg-ink-600 outline-none hover:bg-ink-500 focus-visible:shadow-focus disabled:opacity-40"
                    >
                      <Plus aria-hidden strokeWidth={1.75} className="size-4" />
                    </button>
                  </div>
                )}
                <Button asChild size="lg" variant={ink ? "default" : "outline"} className={cn("h-12 rounded-[12px] text-[15px]", !ink && "border-ink")}>
                  <Link href={plan.cta === "contact" ? "/book" : "/signup"}>{t(`cta.${plan.cta}`)}</Link>
                </Button>
                <div className="flex flex-col gap-2.5 pt-1">
                  <p className={cn("text-[13px] font-bold", ink && "text-zest")}>{previous ? t("includesAll", { plan: previous }) : t("includes")}</p>
                  <ul className="flex flex-col gap-2.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm leading-relaxed">
                        <span className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full", ink ? "bg-mint text-ink" : "bg-mint-50 text-mint-700")}>
                          <Check aria-hidden strokeWidth={3} className="size-3" />
                        </span>
                        {t(`features.${f}` as never)}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
        <p className="text-center text-[13px] text-ink-500">{t("vat")}</p>
      </section>

      <section aria-labelledby="compare-heading" className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-wrap items-baseline gap-4">
          <h2 id="compare-heading" className="flex-1 text-[clamp(28px,3.5vw,36px)] font-bold">
            {t("compare.title")}
          </h2>
          <span className="text-[15px] text-ink-500">{t(`segments.${segment}.name`)}</span>
        </div>
        <div className="relative overflow-x-auto rounded-[24px] border border-ink-100">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="bg-ink-50">
              <tr>
                <th scope="col" className="px-5 py-4 text-start font-bold">
                  <span className="sr-only">{t("compare.feature")}</span>
                </th>
                {plans.map((p) => (
                  <th key={p.tier} scope="col" className={cn("px-3 py-4 text-center font-bold", p.popular && "bg-zest")}>
                    {t(`plans.${segment}.${p.tier}.name`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARE[segment].map(({ row, cells }) => (
                <tr key={row} className="border-t border-ink-50">
                  <th scope="row" className="px-5 py-3.5 text-start font-semibold">
                    {t(row as never)}
                  </th>
                  {cells.map((cell, i) => (
                    <td key={i} className={cn("px-3 py-3.5 text-center", plans[i].popular && "bg-zest-50 font-bold")}>
                      {cell === true ? (
                        <span className="inline-flex size-6 items-center justify-center rounded-full bg-mint-50 text-mint-700">
                          <Check aria-hidden strokeWidth={3} className="size-3" />
                          <span className="sr-only">{t("compare.yes")}</span>
                        </span>
                      ) : cell === false ? (
                        <span className="text-ink-300">
                          <span aria-hidden>{"—"}</span>
                          <span className="sr-only">{t("compare.no")}</span>
                        </span>
                      ) : (
                        <span className="tabular">{cellText(cell)}</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
