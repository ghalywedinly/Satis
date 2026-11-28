import Image from "next/image";
import {
  ArrowLeft,
  BellRing,
  Check,
  Clock3,
  Dices,
  EyeOff,
  Lock,
  MapPin,
  MessageCircleOff,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Ticket,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ClinicObject, CupObject, ShoppingBagObject } from "@/components/brand/objects";
import { SatisSeal } from "@/components/brand/seal";
import { StarBlocks } from "@/components/brand/star-blocks";
import { Button } from "@/components/ui/button";
import { formatCount, formatNumber, formatPercent, formatSar } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { ScorePill } from "@/modules/score/components/score-pill";
import { MIN_RATINGS } from "@/modules/score/definition";

/*
 * The home page story: the problem, the solution, what a business gets, worked examples,
 * and the Satis badge. Every visual is decorative (aria-hidden); the text carries the meaning.
 */

const WRAP = "mx-auto w-full max-w-[1240px] px-4 sm:px-6";
/** Quotation marks for a customer's words: «…» in Arabic, “…” in English. */
export const quote = (locale: Locale, text: string) => (locale === "ar" ? `«${text}»` : `\u201c${text}\u201d`);
const one = (locale: Locale, v: number) => formatNumber(locale, v, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function Heading({ eyebrow, title, body, invert, className }: { eyebrow: string; title: string; body?: string; invert?: boolean; className?: string }) {
  return (
    <div className={cn("flex max-w-3xl flex-col gap-3", className)}>
      <span className={cn("text-sm font-bold", invert ? "text-zest" : "text-ink-500")}>{eyebrow}</span>
      <h2 className="text-[clamp(30px,4.2vw,46px)] leading-snug font-bold">{title}</h2>
      {body && <p className={cn("max-w-[62ch] text-lg leading-[1.85]", invert ? "text-ink-200" : "text-ink-500")}>{body}</p>}
    </div>
  );
}

/* ───────── The problem ───────── */

export function Problem() {
  const t = useTranslations("home.problem");
  const locale = useLocale() as Locale;
  const pains: { key: "late" | "blind" | "guess"; Icon: LucideIcon }[] = [
    { key: "late", Icon: MessageCircleOff },
    { key: "blind", Icon: EyeOff },
    { key: "guess", Icon: Dices },
  ];
  const steps = [
    {
      key: "visit",
      bg: "bg-zest",
      visual: (
        <>
          <CupObject className="size-[52%]" />
          <span className="absolute start-5 top-5 inline-flex -rotate-3 items-center gap-1.5 rounded-full border-2 border-ink bg-white px-3 py-1.5 text-sm font-bold">
            <Clock3 strokeWidth={2} className="size-4 text-ember-700" />
            {t("wait", { minutes: formatCount(locale, 25) })}
          </span>
        </>
      ),
    },
    {
      key: "silent",
      bg: "bg-ink-50",
      visual: (
        <>
          <Image src="/characters/young-customer.png" alt="" width={1024} height={1536} sizes="220px" className="absolute -bottom-24 h-auto w-[56%]" />
          <span className="absolute start-5 top-6 max-w-[62%] rounded-[18px] rounded-ss-[4px] border-2 border-ink bg-white px-4 py-2.5 text-[15px] font-semibold">
            {t("fine")}
          </span>
        </>
      ),
    },
    {
      key: "gone",
      bg: "bg-ember",
      visual: (
        <span className="flex w-[78%] rotate-2 flex-col gap-2.5 rounded-[20px] border-2 border-ink bg-white p-4 shadow-[8px_8px_0_#0B0D12]">
          <span className="flex items-center gap-2 text-xs text-ink-500">
            <MapPin strokeWidth={2} className="size-4 text-ember-700" />
            <span className="flex-1 truncate">{t("mapReview")}</span>
          </span>
          <StarBlocks score={1} size="sm" />
          <span className="text-sm leading-snug font-semibold">{t("review")}</span>
        </span>
      ),
    },
  ] as const;

  return (
    <section id="problem" className={cn(WRAP, "flex scroll-mt-24 flex-col gap-12 pt-28")}>
      <Heading eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
      <ol className="grid gap-5 lg:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.key} className="relative flex flex-col gap-4">
            <div aria-hidden className={cn("relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-[28px]", s.bg)}>
              {s.visual}
            </div>
            <div className="flex items-start gap-3 px-1">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-ink font-display text-sm font-extrabold text-white">{formatCount(locale, i + 1)}</span>
              <span className="flex flex-col gap-1">
                <h3 className="font-sans text-lg font-bold">{t(`journey.${s.key}.title`)}</h3>
                <p className="leading-[1.75] text-ink-500">{t(`journey.${s.key}.body`)}</p>
              </span>
            </div>
            {i < steps.length - 1 && (
              <span aria-hidden className="absolute top-[calc(37.5%-20px)] -end-[22px] z-10 hidden size-10 items-center justify-center rounded-full border-2 border-ink bg-white lg:flex">
                <ArrowLeft strokeWidth={2} className="size-5 ltr:rotate-180" />
              </span>
            )}
          </li>
        ))}
      </ol>
      <ul className="grid gap-px overflow-hidden rounded-[24px] border border-ink-100 bg-ink-100 sm:grid-cols-3">
        {pains.map(({ key, Icon }) => (
          <li key={key} className="flex gap-4 bg-white p-6">
            <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-tile bg-ember-50 text-ember-700">
              <Icon strokeWidth={1.75} className="size-5" />
            </span>
            <span className="flex flex-col gap-1">
              <span className="font-bold">{t(`pains.${key}.title`)}</span>
              <span className="text-sm leading-[1.75] text-ink-500">{t(`pains.${key}.body`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── The solution: before and after ───────── */

export function Solution() {
  const t = useTranslations("home.solution");
  const rows = ["when", "who", "where", "change", "angry"] as const;
  return (
    <section id="solution" className="scroll-mt-24 px-3 pt-24 sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-10 overflow-hidden rounded-[32px] bg-ink px-5 py-14 text-white sm:rounded-[40px] sm:px-14 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <Heading invert eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
          <SatisSeal ring className="hidden size-32 shrink-0 lg:block" />
        </div>
        <table className="w-full border-separate border-spacing-x-2 border-spacing-y-2 text-start sm:border-spacing-x-4">
          <thead>
            <tr>
              <th scope="col" className="w-1/2 pb-2 text-start text-sm font-bold text-ink-300">
                {t("without")}
              </th>
              <th scope="col" className="w-1/2 pb-2 text-start text-sm font-bold text-zest">
                {t("with")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r}>
                <td className="rounded-[16px] bg-ink-800 p-4 align-top text-[15px] leading-relaxed text-ink-300 sm:px-5">
                  <span className="flex gap-3">
                    <X aria-hidden strokeWidth={2.25} className="mt-1 size-4 shrink-0 text-ember" />
                    {t(`rows.${r}.without`)}
                  </span>
                </td>
                <td className="rounded-[16px] bg-white p-4 align-top text-[15px] leading-relaxed font-semibold text-ink sm:px-5">
                  <span className="flex gap-3">
                    <Check aria-hidden strokeWidth={2.5} className="mt-1 size-4 shrink-0 text-mint-700" />
                    {t(`rows.${r}.with`)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────── What a business gets (bento) ───────── */

function Tile({ title, body, visual, bg, className }: { title: string; body: string; visual: React.ReactNode; bg: string; className?: string }) {
  return (
    <li className={cn("flex flex-col overflow-hidden rounded-[28px] border border-ink-100 bg-white", className)}>
      <div aria-hidden className={cn("relative flex h-[230px] items-center justify-center overflow-hidden px-6", bg)}>
        {visual}
      </div>
      <div className="flex flex-col gap-1.5 p-6">
        <h3 className="font-sans text-lg leading-snug font-bold">{title}</h3>
        <p className="leading-[1.75] text-ink-500">{body}</p>
      </div>
    </li>
  );
}

export function Benefits() {
  const t = useTranslations("home.benefits");
  const tb = useTranslations("home.badge");
  const m = useTranslations("home.mock");
  const locale = useLocale() as Locale;
  const branches = [
    { name: m("locationB"), score: 4.8, tone: "bg-mint" },
    { name: m("locationA"), score: 4.4, tone: "bg-zest" },
    { name: m("locationC"), score: 3.6, tone: "bg-ember" },
  ];
  const weeks = [2.9, 3.1, 3.0, 3.4, 3.7, 3.9, 4.1, 4.3];
  const item = (k: string) => ({ title: t(`items.${k}.title` as never), body: t(`items.${k}.body` as never) });

  return (
    <section id="benefits" className={cn(WRAP, "flex scroll-mt-24 flex-col gap-10 pt-24")}>
      <Heading eyebrow={t("eyebrow")} title={t("title")} body={t("body")} />
      <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-6">
        <Tile
          {...item("catch")}
          bg="bg-ember"
          className="lg:col-span-3"
          visual={
            <span className="relative w-full max-w-[340px]">
              <span className="absolute inset-x-6 -top-3 h-full rotate-3 rounded-[20px] border-2 border-ink bg-white/70" />
              <span className="relative flex flex-col gap-2.5 rounded-[20px] border-2 border-ink bg-white p-4 shadow-[8px_8px_0_#0B0D12]">
                <span className="flex items-center gap-2 text-xs">
                  <span className="flex size-7 items-center justify-center rounded-full bg-ember text-ink">
                    <BellRing strokeWidth={2} className="size-4" />
                  </span>
                  <span className="flex-1 font-bold">{t("alert")}</span>
                  <span className="text-ink-500">{t("minutesAgo", { count: formatCount(locale, 3) })}</span>
                </span>
                <StarBlocks score={2} size="sm" />
                <span className="text-sm font-semibold">{quote(locale, m("comment2"))}</span>
                <span className="text-xs text-ink-500">{m("locationA")}</span>
              </span>
            </span>
          }
        />
        <Tile
          {...item("branch")}
          bg="bg-mint"
          className="lg:col-span-3"
          visual={
            <span className="flex w-full max-w-[340px] flex-col gap-1 rounded-[20px] border-2 border-ink bg-white p-4 shadow-[8px_8px_0_#0B0D12]">
              <span className="pb-1 text-sm font-bold">{m("branches")}</span>
              {branches.map((b) => (
                <span key={b.name} className="grid grid-cols-[minmax(0,1fr)_6rem_2rem] items-center gap-3 border-t border-ink-50 py-2">
                  <span className="truncate text-[13px] font-semibold">{b.name}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-ink-50">
                    <span className={cn("block h-full rounded-full", b.tone)} style={{ width: `${(b.score / 5) * 100}%` }} />
                  </span>
                  <span className="text-end font-display font-extrabold tabular">{one(locale, b.score)}</span>
                </span>
              ))}
            </span>
          }
        />
        <Tile
          {...item("winback")}
          bg="bg-zest"
          className="lg:col-span-2"
          visual={
            <span className="flex w-full max-w-[270px] -rotate-3 items-stretch overflow-hidden rounded-[18px] border-2 border-ink bg-white shadow-[8px_8px_0_#0B0D12]">
              <span className="flex items-center justify-center bg-ultramarine px-4 text-white">
                <Ticket strokeWidth={1.75} className="size-6" />
              </span>
              <span className="flex flex-1 flex-col gap-1 border-s-2 border-dashed border-ink-200 p-4">
                <span className="font-display text-3xl font-extrabold tabular">{formatPercent(locale, 0.2, 0)}</span>
                <span className="text-[13px] leading-snug font-semibold">{m("coupon", { amount: `\u2066${formatPercent(locale, 0.2, 0)}\u2069` })}</span>
              </span>
            </span>
          }
        />
        <Tile
          {...item("prove")}
          bg="bg-ultramarine"
          className="lg:col-span-2"
          visual={
            <span className="flex w-full max-w-[270px] flex-col gap-3 rounded-[20px] border-2 border-ink bg-white p-4 shadow-[8px_8px_0_#0B0D12]">
              <span className="text-xs font-bold">{t("waitScore")}</span>
              <span className="flex h-20 items-end gap-1.5">
                {weeks.map((w, i) => (
                  <span key={i} className={cn("flex-1 rounded-t-[4px]", i < 3 ? "bg-ink-100" : "bg-mint")} style={{ height: `${((w - 2) / 3) * 100}%` }} />
                ))}
              </span>
              <span className="flex items-center justify-between text-xs">
                <span className="text-ink-500">
                  {t("before")} <b className="font-display text-sm font-extrabold text-ink tabular">{one(locale, weeks[0]!)}</b>
                </span>
                <span className="text-ink-500">
                  {t("after")} <b className="font-display text-sm font-extrabold text-mint-700 tabular">{one(locale, weeks[weeks.length - 1]!)}</b>
                </span>
              </span>
            </span>
          }
        />
        <Tile
          {...item("time")}
          bg="bg-ink"
          className="md:col-span-2 lg:col-span-2"
          visual={
            <span className="flex w-full max-w-[280px] flex-col gap-2.5 rounded-[20px] bg-white p-4 shadow-[8px_8px_0_#FFCF28]">
              <span className="flex items-center gap-2 text-xs font-bold">
                <Sparkles strokeWidth={2} className="size-4 text-ultramarine" />
                {t("summary")}
              </span>
              <span className="text-[13px] leading-relaxed">{m("insight")}</span>
            </span>
          }
        />
        <li className="flex flex-col items-start gap-6 overflow-hidden rounded-[28px] bg-ink-50 p-6 sm:p-8 md:col-span-2 lg:col-span-6 lg:flex-row lg:items-center">
          <div className="flex flex-1 flex-col gap-1.5">
            <h3 className="font-sans text-lg leading-snug font-bold">{t("items.grow.title")}</h3>
            <p className="max-w-[52ch] leading-[1.75] text-ink-500">{t("items.grow.body")}</p>
          </div>
          <div aria-hidden className="flex flex-wrap items-center gap-3">
            <ScorePill name={m("teamOwner")} score={4.7} satisfied={1962} />
            <ScorePill name={m("teamOwner")} score={4.7} satisfied={1962} size="small" />
          </div>
          <Link href="/#badge" className="inline-flex items-center gap-1.5 rounded-xs text-[15px] font-semibold text-ultramarine outline-none hover:underline focus-visible:shadow-focus">
            {tb("eyebrow")}
            <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4 ltr:rotate-180" />
          </Link>
        </li>
      </ul>
    </section>
  );
}

/* ───────── Worked examples ───────── */

const CASES = [
  { key: "cafe", bg: "bg-zest", Obj: CupObject, before: 3.6, after: 4.5, weeks: 6 },
  { key: "clinic", bg: "bg-ultramarine", Obj: ClinicObject, before: 3.9, after: 4.6, weeks: 8 },
  { key: "retail", bg: "bg-mint", Obj: ShoppingBagObject, before: 3.7, after: 4.4, weeks: 10 },
] as const;

export function CaseStudies() {
  const t = useTranslations("home.cases");
  const locale = useLocale() as Locale;
  return (
    <section id="cases" className={cn(WRAP, "flex scroll-mt-24 flex-col gap-10 pt-24")}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Heading eyebrow={t("eyebrow")} title={t("title")} />
        <p className="max-w-[40ch] text-sm text-ink-500">{t("note")}</p>
      </div>
      <ul className="flex flex-col gap-6">
        {CASES.map(({ key, bg, Obj, before, after, weeks }) => (
          <li key={key}>
            <article aria-labelledby={`case-${key}`} className="grid overflow-hidden rounded-[32px] border border-ink-100 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
              <div aria-hidden className={cn("relative flex min-h-[320px] flex-col justify-between gap-6 overflow-hidden p-6 sm:p-8", bg)}>
                <Obj className="absolute -end-4 -top-4 size-40 sm:size-48" />
                <span className="relative max-w-[62%] -rotate-2 rounded-[18px] rounded-ss-[4px] border-2 border-ink bg-white px-4 py-3 text-ink shadow-[6px_6px_0_#0B0D12]">
                  <StarBlocks score={2} size="sm" className="mb-2" />
                  <span className="text-[15px] font-semibold">{quote(locale, t(`items.${key}.quote`))}</span>
                </span>
                <span className="relative flex w-full max-w-[360px] flex-col gap-3 rounded-[20px] bg-white p-5 text-ink">
                  <span className="flex items-center justify-between text-xs font-bold text-ink-500">
                    {t("result")}
                    <span>{t("weeks", { count: formatCount(locale, weeks) })}</span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-display text-3xl font-extrabold text-ink-300 tabular">{one(locale, before)}</span>
                    <ArrowLeft strokeWidth={2} className="size-5 text-ink-400 ltr:rotate-180" />
                    <span className="font-display text-5xl font-extrabold tabular">{one(locale, after)}</span>
                    <SatisSeal className="ms-auto size-11" />
                  </span>
                  <span className="relative h-2 rounded-full bg-ink-50">
                    <span className="absolute inset-y-0 start-0 rounded-full bg-mint" style={{ width: `${(after / 5) * 100}%` }} />
                    <span className="absolute -inset-y-1 w-0.5 rounded-full bg-ink" style={{ insetInlineStart: `${(before / 5) * 100}%` }} />
                  </span>
                </span>
              </div>
              <div className="flex flex-col gap-6 p-6 sm:p-10">
                <h3 id={`case-${key}`} className="font-sans text-2xl font-bold">
                  {t(`items.${key}.name`)}
                </h3>
                <dl className="flex flex-col gap-5">
                  {(["problem", "found", "action"] as const).map((step, i) => (
                    <div key={step} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-x-3 gap-y-1">
                      <span aria-hidden className={cn("row-span-2 mt-0.5 flex size-8 items-center justify-center rounded-full font-display text-sm font-extrabold", ["bg-ember text-ink", "bg-zest text-ink", "bg-mint text-ink"][i])}>
                        {formatCount(locale, i + 1)}
                      </span>
                      <dt className="text-sm font-bold text-ink-500">{t(step)}</dt>
                      <dd className="text-[17px] leading-[1.75]">{t(`items.${key}.${step}`)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── The Satis badge ───────── */

export function BadgeStory() {
  const t = useTranslations("home.badge");
  const locale = useLocale() as Locale;
  const points: { key: "verified" | "live" | "locked"; Icon: LucideIcon }[] = [
    { key: "verified", Icon: ShieldCheck },
    { key: "live", Icon: RefreshCw },
    { key: "locked", Icon: Lock },
  ];
  return (
    <section id="badge" className={cn(WRAP, "grid scroll-mt-24 items-center gap-14 pt-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]")}>
      <div className="flex flex-col gap-7">
        <Heading eyebrow={t("eyebrow")} title={t("title")} body={t("body", { min: formatCount(locale, MIN_RATINGS) })} />
        <ul className="flex flex-col gap-4">
          {points.map(({ key, Icon }) => (
            <li key={key} className="flex gap-4">
              <span aria-hidden className="flex size-11 shrink-0 items-center justify-center rounded-tile bg-zest text-ink">
                <Icon strokeWidth={1.75} className="size-5" />
              </span>
              <span className="flex flex-col gap-0.5">
                <span className="font-bold">{t(`points.${key}.title`)}</span>
                <span className="text-sm leading-[1.75] text-ink-500">{t(`points.${key}.body`)}</span>
              </span>
            </li>
          ))}
        </ul>
        <Button asChild size="lg" variant="outline" className="h-[52px] self-start rounded-[12px] border-2 border-ink px-6 text-base">
          <Link href="/score">
            {t("cta")}
            <ArrowLeft aria-hidden strokeWidth={1.75} className="ltr:rotate-180" />
          </Link>
        </Button>
      </div>

      {/* A brand's product page with the badge beside the buy button */}
      <div aria-hidden className="relative pe-4 pb-4">
        <SatisSeal ring className="absolute -end-2 -top-10 z-10 size-28 sm:size-32" />
        <div className="overflow-hidden rounded-[24px] border-[3px] border-ink bg-white shadow-[14px_14px_0_#0B0D12]">
          <div className="flex items-center gap-1.5 border-b-[3px] border-ink bg-ink-50 px-4 py-3">
            <span className="size-2.5 rounded-full bg-ember" />
            <span className="size-2.5 rounded-full bg-zest" />
            <span className="size-2.5 rounded-full bg-mint" />
            <span className="ms-3 flex-1 rounded-full bg-white px-3 py-1 text-xs text-ink-500">
              <bdi dir="ltr">{"noracafe.sa/shop"}</bdi>
            </span>
          </div>
          <div className="grid gap-6 p-5 sm:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] sm:p-7">
            <div className="flex aspect-square items-center justify-center rounded-[18px] bg-ember">
              <CupObject className="size-[62%]" />
            </div>
            <div className="flex flex-col gap-4">
              <span className="text-xs font-bold text-ink-500">{t("store")}</span>
              <span className="text-xl leading-snug font-bold">{t("product")}</span>
              <span className="font-display text-2xl font-extrabold tabular">{formatSar(locale, 6900)}</span>
              <ScorePill name={t("store")} score={4.7} satisfied={1962} className="self-start" />
              <span className="mt-auto flex h-12 items-center justify-center rounded-[12px] bg-ultramarine text-[15px] font-semibold text-white">{t("addToCart")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
