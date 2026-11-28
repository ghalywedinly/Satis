import Image from "next/image";
import { ArrowLeft, BarChart3, Check, ClipboardList, Inbox, MapPin, QrCode, Sparkles, Ticket, UsersRound, type LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SatisMark } from "@/components/brand/satis-mark";
import { SatisSeal } from "@/components/brand/seal";
import { StarBlocks } from "@/components/brand/star-blocks";
import { Button } from "@/components/ui/button";
import { formatCount, formatNumber, formatSar } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { FOUNDERS_PRICE, PLANS } from "./plans";
import { quote } from "./story";

const WRAP = "mx-auto w-full max-w-[1240px] px-4 sm:px-6";
const one = (locale: Locale, v: number) => formatNumber(locale, v, { minimumFractionDigits: 1, maximumFractionDigits: 1 });

function SectionTitle({ eyebrow, title, body, className }: { eyebrow?: string; title: string; body?: string; className?: string }) {
  return (
    <div className={cn("flex max-w-3xl flex-col gap-2.5", className)}>
      {eyebrow && <span className="text-sm font-bold text-ink-500">{eyebrow}</span>}
      <h2 className="text-[clamp(30px,4vw,42px)] leading-snug font-bold">{title}</h2>
      {body && <p className="max-w-[60ch] text-lg leading-relaxed text-ink-500">{body}</p>}
    </div>
  );
}

/* ───────── Hero ───────── */

export function Hero() {
  const t = useTranslations("home");
  const m = useTranslations("home.mock");
  const locale = useLocale() as Locale;
  const points = ["noApp", "bilingual", "private", "fast"] as const;
  return (
    <section className="px-3 sm:px-6">
      <div className="mx-auto grid max-w-[1240px] overflow-hidden rounded-[32px] bg-ink text-white sm:rounded-[40px] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <div className="relative z-10 flex flex-col justify-center gap-7 px-6 py-14 sm:px-14 sm:py-20">
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-zest py-1.5 ps-1.5 pe-3.5 text-[13px] font-semibold text-ink">
            <span aria-hidden className="flex size-[22px] items-center justify-center rounded-full bg-ink">
              <SatisMark tone="zest" className="h-2.5" />
            </span>
            {t("eyebrow")}
          </span>
          <h1 className="text-[clamp(40px,5.5vw,60px)] leading-[1.35] font-bold">{t.rich("headline", { hl: (chunks) => <span className="block text-zest">{chunks}</span> })}</h1>
          <p className="max-w-[40ch] text-lg leading-[1.85] text-ink-200">{t("body")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-[52px] rounded-[12px] px-6 text-base">
              <Link href="/book">{t("primaryCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-[52px] rounded-[12px] border-ink-600 bg-transparent px-6 text-base text-white hover:bg-ink-800 hover:text-white">
              <Link href="/#how">
                {t("secondaryCta")}
                <ArrowLeft aria-hidden strokeWidth={1.75} className="ltr:rotate-180" />
              </Link>
            </Button>
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-300">
            {points.map((p) => (
              <li key={p} className="inline-flex items-center gap-2">
                <Check aria-hidden strokeWidth={2.5} className="size-4 text-mint" />
                {t(`customer.points.${p}`)}
              </li>
            ))}
          </ul>
        </div>

        {/* The solution in one picture: the customer rates on their phone, the team sees it land. */}
        <div aria-hidden className="relative min-h-[600px] overflow-hidden sm:min-h-[560px]">
          <Image
            src="/characters/associate.png"
            alt=""
            width={1177}
            height={1337}
            priority
            sizes="(min-width: 1024px) 380px, 70vw"
            className="absolute -end-12 bottom-0 h-auto w-[min(380px,78vw)] drop-shadow-[16px_16px_0_#0B0D12] ltr:-scale-x-100"
          />

          {/* Customer side: the survey on a phone */}
          <div className="absolute start-5 top-8 z-10 flex w-[218px] -rotate-3 flex-col gap-3.5 rounded-[30px] border-[5px] border-ink bg-white p-4 text-ink shadow-[12px_12px_0_#FFCF28] sm:start-[8%] sm:w-[236px]">
            <span className="mx-auto h-1.5 w-12 rounded-full bg-ink-100" />
            <span className="flex items-center gap-2 text-xs font-semibold text-ink-500">
              <span className="flex size-6 items-center justify-center rounded-[7px] bg-zest font-display text-[13px] font-extrabold text-ink">{t("hero.cardStore").slice(0, 1)}</span>
              {m("rateVisit")}
            </span>
            <span className="text-[17px] leading-snug font-bold">{m("question")}</span>
            <StarBlocks score={4} size="md" />
            <span className="rounded-[10px] bg-ultramarine py-2.5 text-center text-sm font-semibold text-white">{m("send")}</span>
          </div>

          {/* Team side: the response lands and the score moves */}
          <div className="absolute start-16 bottom-8 z-10 flex w-[236px] flex-col gap-3 sm:start-[22%] sm:bottom-12 sm:w-[260px]">
            <div className="flex items-center gap-3 rounded-[20px] bg-white p-3.5 text-ink motion-safe:animate-float">
              <SatisSeal className="size-11 shrink-0" />
              <span className="flex flex-col leading-tight">
                <span className="text-xs text-ink-500">{t("hero.card")}</span>
                <span className="flex items-baseline gap-1.5">
                  <span className="font-display text-[28px] font-extrabold tabular">{one(locale, 4.7)}</span>
                  <span className="rounded-sm bg-mint-50 px-1.5 py-0.5 text-xs font-bold text-mint-700">
                    {"▲ "}
                    {one(locale, 0.2)}
                  </span>
                </span>
              </span>
            </div>
            <div className="flex flex-col gap-1.5 rounded-[20px] bg-white p-3.5 text-ink">
              <span className="flex items-center gap-2 text-xs text-ink-500">
                <span className="size-2 rounded-full bg-mint" />
                <span className="flex-1 font-semibold text-ink">{m("newResponse")}</span>
                {m("justNow")}
              </span>
              <span className="text-sm font-semibold">{quote(locale, m("comment1"))}</span>
              <span className="text-xs text-ink-500">{m("locationB")}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── How it works ───────── */

export function HowItWorks() {
  const t = useTranslations("home.how");
  const locale = useLocale() as Locale;
  const steps = [
    { key: "place", tone: "bg-zest text-ink" },
    { key: "collect", tone: "bg-ember text-ink" },
    { key: "understand", tone: "bg-mint text-ink" },
    { key: "improve", tone: "bg-ultramarine text-white" },
  ] as const;
  return (
    <section id="how" className={cn(WRAP, "flex scroll-mt-24 flex-col gap-10 py-16")}>
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} />
      <ol className="relative grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        <span aria-hidden className="absolute inset-x-8 top-8 hidden border-t-2 border-dashed border-ink-100 lg:block" />
        {steps.map(({ key, tone }, i) => (
          <li key={key} className="relative flex flex-col gap-3.5">
            <span className={cn("flex size-16 items-center justify-center rounded-full font-display text-[26px] font-extrabold ring-8 ring-white", tone)}>
              <span className="sr-only">{t("step", { number: formatCount(locale, i + 1) })}</span>
              <span aria-hidden>{formatCount(locale, i + 1)}</span>
            </span>
            <h3 className="font-sans text-xl font-bold">{t(`steps.${key}.title`)}</h3>
            <p className="leading-[1.8] text-ink-500">{t(`steps.${key}.body`)}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

/* ───────── Customer experience (Mint) ───────── */

export function CustomerFlow({ qrSvg }: { qrSvg: string }) {
  const t = useTranslations("home");
  const m = useTranslations("home.mock");
  const points = ["noApp", "bilingual", "private", "fast"] as const;
  return (
    <section className="px-3 sm:px-6">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-12 overflow-hidden rounded-[32px] bg-mint px-6 py-14 text-ink sm:rounded-[40px] sm:p-16">
        <div className="flex min-w-0 flex-[1_1_380px] flex-col gap-5">
          <span className="text-sm font-bold">{t("customer.eyebrow")}</span>
          <h2 className="text-[clamp(34px,4.5vw,48px)] leading-snug font-bold">{t("customer.title")}</h2>
          <p className="max-w-[44ch] text-lg leading-[1.85]">{t("customer.body")}</p>
          <ul className="grid max-w-md grid-cols-2 gap-2.5">
            {points.map((p) => (
              <li key={p} className="flex items-center gap-2.5 rounded-tile bg-white px-3.5 py-3 text-[15px] font-semibold">
                <span aria-hidden className="size-2 rounded-full bg-ink" />
                {t(`customer.points.${p}`)}
              </li>
            ))}
          </ul>
        </div>
        <div aria-hidden className="mx-auto flex items-end gap-5">
          <div className="hidden w-[150px] -rotate-[4deg] flex-col items-center gap-2.5 rounded-[22px] bg-white p-4 drop-shadow-[12px_12px_0_#0B0D12] sm:flex">
            <span className="text-center text-xs font-bold">{m("scanMe")}</span>
            <div className="size-[110px] [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <span className="flex items-center gap-1.5 text-[11px] text-ink-500">
              <SatisMark tone="zest" className="h-3" />
              {m("store")}
            </span>
          </div>
          <div className="h-[520px] w-[280px] rounded-[40px] bg-ink p-[9px] drop-shadow-[14px_14px_0_#0B0D12]">
            <div className="flex size-full flex-col overflow-hidden rounded-[32px] bg-white">
              <div className="flex items-center gap-2 border-b border-ink-50 px-4 pt-8 pb-3.5">
                <span className="flex size-[30px] items-center justify-center rounded-[9px] bg-ember font-bold">{Array.from(m("teamOwner"))[0]}</span>
                <span className="flex-1 text-[13px] font-bold">{m("rateVisit")}</span>
              </div>
              <div className="flex flex-1 flex-col gap-3.5 p-[18px]">
                <span className="text-base font-bold">{m("question")}</span>
                <span dir="ltr" className="flex gap-1.5">
                  <StarBlocks score={4} size="lg" />
                </span>
                <span className="mt-1.5 text-sm font-bold">{m("standOut")}</span>
                <span className="flex flex-wrap gap-1.5 text-xs">
                  <span className="rounded-full bg-ink px-3 py-1.5 text-white">{m("speed")}</span>
                  <span className="rounded-full bg-ink px-3 py-1.5 text-white">{m("staff")}</span>
                  <span className="rounded-full border border-ink-100 px-3 py-1.5">{m("wait")}</span>
                </span>
                <span className="mt-auto flex h-[46px] items-center justify-center rounded-[12px] bg-ultramarine text-[15px] font-semibold text-white">{m("send")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── Dashboard preview ───────── */

/* ───────── Features ───────── */

const FEATURES: { key: string; Icon: LucideIcon }[] = [
  { key: "surveys", Icon: ClipboardList },
  { key: "qr", Icon: QrCode },
  { key: "inbox", Icon: Inbox },
  { key: "analytics", Icon: BarChart3 },
  { key: "locations", Icon: MapPin },
  { key: "team", Icon: UsersRound },
  { key: "coupons", Icon: Ticket },
  { key: "ai", Icon: Sparkles },
];
const FEATURE_TONES = ["bg-zest text-ink", "bg-ember text-ink", "bg-mint text-ink", "bg-ultramarine text-white"];

export function Features() {
  const t = useTranslations("home.features");
  return (
    <section id="features" className={cn(WRAP, "flex scroll-mt-24 flex-col gap-9 pt-24 pb-10")}>
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} body={t("subtitle")} />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map(({ key, Icon }, i) => (
          <li key={key} className="flex flex-col gap-3 rounded-card border border-ink-100 p-5 transition-colors duration-[140ms] hover:border-ink-200">
            <span aria-hidden className={cn("flex size-11 items-center justify-center rounded-tile", FEATURE_TONES[i % 4])}>
              <Icon strokeWidth={1.75} className="size-5" />
            </span>
            <h3 className="font-sans text-[17px] font-bold">{t(`${key}.title` as never)}</h3>
            <p className="text-sm leading-[1.8] text-ink-500">{t(`${key}.body` as never)}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ───────── Plans teaser (Zest) ───────── */

export function PlansTeaser() {
  const t = useTranslations("home.plans");
  const locale = useLocale() as Locale;
  const groups = (["visits", "orders", "apps"] as const).map((g) => ({ g, price: PLANS[g].find((p) => p.tier === "starter")?.price ?? 0 }));
  return (
    <section id="pricing" className="scroll-mt-24 px-3 pt-16 sm:px-6">
      <div className="relative mx-auto flex max-w-[1240px] flex-col gap-8 overflow-hidden rounded-[32px] bg-zest px-6 py-14 text-ink sm:rounded-[40px] sm:p-16">
        <div className="relative z-10 flex max-w-2xl flex-col gap-3">
          <span className="text-sm font-bold">{t("eyebrow")}</span>
          <h2 className="text-[clamp(32px,4.5vw,48px)] leading-snug font-bold">{t("title")}</h2>
          <p className="text-lg leading-relaxed">{t("body")}</p>
        </div>
        <ul className="relative z-10 grid gap-4 md:grid-cols-3 lg:max-w-[72%]">
          {groups.map(({ g, price }) => (
            <li key={g} className="flex flex-col gap-1.5 rounded-[22px] bg-white p-5">
              <span className="font-bold">{t(`groups.${g}.name`)}</span>
              <span className="flex flex-wrap items-baseline gap-1.5">
                <span className="text-sm">{t("from")}</span>
                <span className="font-display text-3xl font-extrabold tabular">{formatSar(locale, price * 100)}</span>
                <span className="text-sm text-ink-500">{t("perMonth")}</span>
              </span>
              <span className="text-[13px] text-ink-500">{t(`groups.${g}.unit`)}</span>
            </li>
          ))}
        </ul>
        <div className="relative z-10 flex flex-wrap items-center gap-4">
          <Button asChild size="lg" className="h-[52px] rounded-[12px] bg-ink px-6 text-base text-white hover:bg-ink-700">
            <Link href="/pricing">{t("cta")}</Link>
          </Button>
          <span className="rounded-full bg-ink/10 px-3.5 py-2 text-sm font-semibold">{t("founders", { price: formatSar(locale, FOUNDERS_PRICE * 100) })}</span>
        </div>
        <Image
          src="/characters/man-thobe.png"
          alt=""
          width={1211}
          height={1299}
          sizes="340px"
          className="pointer-events-none absolute -end-6 -bottom-12 hidden h-[360px] w-auto drop-shadow-[14px_14px_0_#0B0D12] lg:block"
        />
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */

export function Faq() {
  const t = useTranslations("home.faq");
  const items = ["app", "arabic", "branches", "edit", "privacy", "setup"] as const;
  return (
    <section id="faq" className={cn(WRAP, "grid scroll-mt-24 gap-10 pt-24 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]")}>
      <SectionTitle eyebrow={t("eyebrow")} title={t("title")} />
      <div className="flex flex-col">
        {items.map((item) => (
          <details key={item} className="group border-t border-ink-100 py-5">
            <summary className="flex cursor-pointer list-none items-center gap-4 rounded-sm text-lg font-bold outline-none focus-visible:shadow-focus [&::-webkit-details-marker]:hidden">
              <span className="flex-1">{t(`items.${item}.q`)}</span>
              <ChevronIcon />
            </summary>
            <p className="mt-3 max-w-[60ch] leading-[1.85] text-ink-600">{t(`items.${item}.a`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function ChevronIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-5 shrink-0 transition-transform duration-[200ms] group-open:rotate-180">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/* ───────── Closing call to action (Ink, Yousef) ───────── */

export function FinalCta() {
  const t = useTranslations("home.finalCta");
  return (
    <section className="px-3 pt-10 pb-24 sm:px-6">
      <div className="mx-auto grid max-w-[1240px] overflow-hidden rounded-[32px] bg-ink text-white sm:rounded-[40px] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col justify-center gap-5 px-6 py-14 sm:p-16">
          <h2 className="text-[clamp(32px,4.5vw,48px)] leading-snug font-bold">{t("title")}</h2>
          <p className="text-lg leading-[1.85] text-ink-200">{t("body")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="h-[52px] rounded-[12px] px-6 text-base">
              <Link href="/book">{t("primary")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-[52px] rounded-[12px] border-ink-600 bg-transparent px-6 text-base text-white hover:bg-ink-800 hover:text-white">
              <Link href="/login">{t("secondary")}</Link>
            </Button>
          </div>
        </div>
        <div aria-hidden className="relative min-h-[340px]">
          <div className="absolute start-1/2 -bottom-32 size-[360px] -translate-x-1/2 rounded-full bg-ultramarine rtl:translate-x-1/2" />
          <Image
            src="/characters/yousef-wave.png"
            alt=""
            width={228}
            height={633}
            sizes="150px"
            className="absolute start-1/2 -bottom-6 h-[380px] w-auto -translate-x-1/2 drop-shadow-[14px_14px_0_#FFCF28] rtl:translate-x-1/2"
          />
        </div>
      </div>
    </section>
  );
}
