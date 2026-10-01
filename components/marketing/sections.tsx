import { Plus, BarChart3, Building2, Check, Coffee, Dumbbell, Hotel, MessageSquareText, QrCode, ScanLine, ShieldCheck, ShoppingBag, Sparkles, Stethoscope, Ticket, Users, UtensilsCrossed, Gamepad2, Scissors, Languages, Smartphone, Timer } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SatisMark } from "@/components/brand/satis-mark";
import { OutlinedCard, SliceHighlight, SpeedLines, Supergraphic } from "@/components/brand/slice";
import { Button } from "@/components/ui/button";
import { formatCount, formatNumber, formatPercent, formatSar } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { BrowserFrame, MiniRating, PhoneFrame, PillBar, SlantedBars, Sparkline } from "./mockups";
import { ScanScreen, SurveyScreen, ThanksScreen } from "./phone-screens";

/** Price of the launch plan in halalas. Moves to the plans table with billing (Phase 8). */
export const LAUNCH_PRICE_HALALAS = 15000;

function SectionHeading({ eyebrow, title, body, center = false, dark = false }: { eyebrow: string; title: string; body?: string; center?: boolean; dark?: boolean }) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-3", center && "mx-auto items-center text-center")}>
      <span className={cn("eyebrow", dark && "!text-ink-300")}>{eyebrow}</span>
      <h2 className={cn("text-[clamp(30px,4vw,48px)] leading-[1.08] font-extrabold", dark && "text-sand")}>{title}</h2>
      {body && <p className={cn("text-lg leading-relaxed", dark ? "text-ink-200" : "text-muted-foreground")}>{body}</p>}
    </div>
  );
}

/* ───────── Industries ───────── */

const INDUSTRIES = [
  { key: "cafe", Icon: Coffee },
  { key: "restaurant", Icon: UtensilsCrossed },
  { key: "retail", Icon: ShoppingBag },
  { key: "clinic", Icon: Stethoscope },
  { key: "beauty", Icon: Scissors },
  { key: "gym", Icon: Dumbbell },
  { key: "hotel", Icon: Hotel },
  { key: "entertainment", Icon: Gamepad2 },
] as const;

export function Industries() {
  const t = useTranslations("home.industries");
  const types = useTranslations("organization.businessTypes");
  return (
    <section className="border-b border-border bg-white">
      <div className="mx-auto flex w-full max-w-[1216px] flex-col items-center gap-6 px-4 py-10 sm:px-6">
        <p className="text-center text-sm font-semibold text-muted-foreground">{t("title")}</p>
        <ul className="flex flex-wrap justify-center gap-2.5">
          {INDUSTRIES.map(({ key, Icon }) => (
            <li key={key} className="flex items-center gap-2 rounded-full border border-border bg-sand px-4 py-2 text-sm font-semibold">
              <Icon aria-hidden strokeWidth={1.75} className="size-4 text-ultramarine" />
              {types(key)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────── How it works ───────── */

function QrStandIllustration({ qrSvg }: { qrSvg: string }) {
  const t = useTranslations("home.mock");
  return (
    <div className="relative flex h-full items-end justify-center">
      <div className="relative z-10 flex w-36 flex-col items-center gap-2 rounded-t-[16px] rounded-b-[6px] border-[3px] border-ink bg-white px-3 pt-3 pb-4">
        <SatisMark tone="ink-ultra" className="h-4 w-auto" />
        <div className="size-24 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
        <span className="text-center text-[10px] leading-tight font-semibold">{t("scanMe")}</span>
      </div>
      <div className="absolute bottom-0 h-3 w-48 rounded-full bg-ink/10" />
      <span className="slice-md absolute end-2 top-3 h-5 w-16 bg-zest" />
    </div>
  );
}

function PhoneIllustration() {
  return (
    <div className="flex h-full items-end justify-center">
      <PhoneFrame className="h-[210px] w-[150px] translate-y-6 [&_.font-display]:text-sm">
        <SurveyScreen rating={4} />
      </PhoneFrame>
    </div>
  );
}

function ChartIllustration() {
  const t = useTranslations("home.mock");
  const locale = useLocale() as Locale;
  return (
    <div className="flex h-full items-center justify-center">
      <OutlinedCard className="flex w-56 flex-col gap-2 rounded-[18px] p-4">
        <span className="text-xs text-muted-foreground">{t("csat")}</span>
        <span className="font-display text-3xl font-extrabold tracking-[-0.04em]">{formatPercent(locale, 0.924, 1)}</span>
        <SlantedBars heights={[40, 55, 48, 62, 58, 70, 66, 82]} className="h-16" />
      </OutlinedCard>
    </div>
  );
}

function ImproveIllustration() {
  const t = useTranslations("home.mock");
  return (
    <div className="flex h-full items-center justify-center">
      <OutlinedCard className="flex w-60 flex-col gap-2.5 rounded-[18px] p-4 text-xs">
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold">{t("comment2")}</span>
          <span className="rounded-full bg-ember-50 px-2 py-0.5 font-bold text-ember-700">{formatNumber("en", 2)}</span>
        </span>
        <span className="flex flex-wrap gap-1.5">
          <span className="rounded-full border border-border px-2 py-0.5">{t("tagWait")}</span>
          <span className="rounded-full bg-grape-50 px-2 py-0.5 font-semibold text-grape-600">{t("statusProgress")}</span>
        </span>
        <span className="flex items-center gap-2 rounded-[10px] bg-mint-50 px-2.5 py-2 font-semibold text-mint-700">
          <Check strokeWidth={2.5} className="size-4" />
          {t("comment1")}
        </span>
      </OutlinedCard>
    </div>
  );
}

export function HowItWorks({ qrSvg }: { qrSvg: string }) {
  const t = useTranslations("home.how");
  const locale = useLocale() as Locale;
  const steps = [
    { key: "place", art: <QrStandIllustration qrSvg={qrSvg} />, tone: "bg-ultra-50" },
    { key: "collect", art: <PhoneIllustration />, tone: "bg-ember-50" },
    { key: "understand", art: <ChartIllustration />, tone: "bg-zest-50" },
    { key: "improve", art: <ImproveIllustration />, tone: "bg-mint-50" },
  ] as const;
  return (
    <section id="how" className="scroll-mt-20 bg-sand">
      <div className="mx-auto flex w-full max-w-[1216px] flex-col gap-12 px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.key} className="flex flex-col overflow-hidden rounded-card border border-border bg-white">
              <div aria-hidden className={cn("h-56 overflow-hidden px-4 pt-6", step.tone)}>
                {step.art}
              </div>
              <div className="flex flex-col gap-2 p-6">
                <span className="slice-sm w-fit bg-ink px-2.5 py-0.5 text-xs font-bold text-sand">{t("step", { number: formatCount(locale, i + 1) })}</span>
                <h3 className="text-xl font-bold">{t(`steps.${step.key}.title`)}</h3>
                <p className="text-muted-foreground">{t(`steps.${step.key}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ───────── Features ───────── */

function FeatureCard({ icon: Icon, title, body, soon, children, className }: { icon: typeof QrCode; title: string; body: string; soon?: string; children?: React.ReactNode; className?: string }) {
  return (
    <li className={cn("flex flex-col overflow-hidden rounded-card border border-border bg-white", className)}>
      {children && (
        <div aria-hidden className="relative flex flex-1 items-center justify-center overflow-hidden bg-sand-100 p-6">
          {children}
        </div>
      )}
      <div className="flex flex-col gap-2 p-6">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-[10px] bg-ultra-50 text-ultramarine">
            <Icon aria-hidden strokeWidth={1.75} className="size-5" />
          </span>
          {soon && <span className="rounded-full bg-grape-50 px-2.5 py-1 text-xs font-semibold text-grape-600">{soon}</span>}
        </div>
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-muted-foreground">{body}</p>
      </div>
    </li>
  );
}

export function Features({ qrSvg, question }: { qrSvg: string; question: { ar: string; en: string } }) {
  const t = useTranslations("home.features");
  const m = useTranslations("home.mock");
  const roles = useTranslations("organization.roles");
  const locale = useLocale() as Locale;
  const inboxRows = [
    { text: m("comment1"), score: 5, tone: "bg-mint-50 text-mint-700", status: m("statusNew"), unread: true },
    { text: m("comment2"), score: 2, tone: "bg-ember-50 text-ember-700", status: m("statusProgress"), unread: false },
    { text: m("comment3"), score: 4, tone: "bg-mint-50 text-mint-700", status: m("statusNew"), unread: true },
  ];
  const branches = [
    { name: m("locationA"), ratio: 0.94 },
    { name: m("locationB"), ratio: 0.81 },
    { name: m("locationC"), ratio: 0.67 },
  ];
  return (
    <section id="features" className="scroll-mt-20 bg-white">
      <div className="mx-auto flex w-full max-w-[1216px] flex-col gap-12 px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} body={t("subtitle")} />
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          <FeatureCard icon={MessageSquareText} title={t("inbox.title")} body={t("inbox.body")} className="lg:col-span-2">
            <div className="flex w-full max-w-lg flex-col gap-2">
              {inboxRows.map((row) => (
                <div key={row.text} className="flex items-center gap-3 rounded-[14px] border border-border bg-white px-4 py-3 text-sm">
                  <span className={cn("size-2 shrink-0 rounded-full", row.unread ? "bg-ultramarine" : "bg-transparent")} />
                  <span className={cn("shrink-0 rounded-[8px] px-2 py-0.5 font-display font-extrabold", row.tone)}>
                    {formatCount(locale, row.score)}
                  </span>
                  <span className="flex-1 truncate font-medium">{row.text}</span>
                  <span className="hidden shrink-0 rounded-full bg-sand-100 px-2 py-0.5 text-xs text-ink-600 sm:inline">{row.status}</span>
                </div>
              ))}
            </div>
          </FeatureCard>
          <FeatureCard icon={QrCode} title={t("qr.title")} body={t("qr.body")}>
            <div className="relative rotate-[-4deg] rounded-[16px] border-[3px] border-ink bg-white p-3">
              <div className="size-28 [&_svg]:size-full" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <span className="absolute -end-6 -top-3 rotate-[4deg] rounded-full border-2 border-ink bg-zest px-2.5 py-0.5 text-xs font-bold">{m("printReady")}</span>
            </div>
          </FeatureCard>
          <FeatureCard icon={BarChart3} title={t("analytics.title")} body={t("analytics.body")}>
            <div className="flex w-full max-w-xs flex-col gap-2 rounded-[16px] border border-border bg-white p-4">
              <span className="text-xs text-muted-foreground">{m("csat")}</span>
              <span className="font-display text-4xl font-extrabold tracking-[-0.04em]">{formatPercent(locale, 0.924, 1)}</span>
              <span className="text-xs font-semibold text-mint-700">{m("vsLast", { value: formatNumber(locale, 3.1, { signDisplay: "always" }) })}</span>
              <SlantedBars heights={[38, 52, 45, 60, 55, 68, 63, 74, 70, 82, 78, 92]} className="h-16" />
            </div>
          </FeatureCard>
          <FeatureCard icon={Building2} title={t("locations.title")} body={t("locations.body")}>
            <div className="flex w-full max-w-xs flex-col gap-3 rounded-[16px] border border-border bg-white p-4">
              {branches.map((b) => (
                <PillBar key={b.name} label={b.name} value={formatPercent(locale, b.ratio, 0)} ratio={b.ratio} color="bg-ultramarine" />
              ))}
            </div>
          </FeatureCard>
          <FeatureCard icon={Languages} title={t("surveys.title")} body={t("surveys.body")}>
            <div className="flex gap-3">
              <div className="flex w-36 flex-col gap-2 rounded-[14px] bg-ink p-3 text-sand" lang="ar" dir="rtl">
                <span className="font-arabic text-sm leading-snug font-bold">{question.ar}</span>
                <MiniRating value={5} dark />
              </div>
              <div className="flex w-36 translate-y-6 flex-col gap-2 rounded-[14px] border-[3px] border-ink bg-white p-3" lang="en" dir="ltr">
                <span className="font-display text-sm leading-snug font-bold">{question.en}</span>
                <MiniRating value={4} />
              </div>
            </div>
          </FeatureCard>
          <FeatureCard icon={Users} title={t("team.title")} body={t("team.body")} className="md:col-span-2 lg:col-span-1">
            <div className="flex w-full max-w-xs flex-col gap-2">
              {(
                [
                  [m("teamOwner"), roles("owner"), "bg-ultramarine"],
                  [m("teamManager"), roles("manager"), "bg-grape"],
                  [m("teamStaff"), roles("staff"), "bg-ember"],
                ] as const
              ).map(([name, role, color]) => (
                <div key={name} className="flex items-center gap-3 rounded-[14px] border border-border bg-white px-3 py-2.5 text-sm">
                  <span className={cn("flex size-8 items-center justify-center rounded-full font-bold text-white", color)}>{name.slice(0, 1)}</span>
                  <span className="flex-1 font-semibold">{name}</span>
                  <span className="rounded-full bg-sand-100 px-2 py-0.5 text-xs">{role}</span>
                </div>
              ))}
            </div>
          </FeatureCard>
          <FeatureCard icon={Ticket} title={t("coupons.title")} body={t("coupons.body")} soon={t("comingSoon")}>
            <div className="relative flex w-full max-w-[260px] items-center gap-3 rounded-[14px] border-2 border-dashed border-ink-300 bg-white p-4">
              <Ticket strokeWidth={1.75} className="size-8 shrink-0 text-ember" />
              <span className="font-display text-base leading-snug font-bold">{m("coupon")}</span>
            </div>
          </FeatureCard>
          <FeatureCard icon={Sparkles} title={t("ai.title")} body={t("ai.body")} soon={t("comingSoon")}>
            <div className="flex w-full max-w-lg items-start gap-3 rounded-[16px] border border-border bg-white p-4">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-grape-50 text-grape-600">
                <Sparkles strokeWidth={1.75} className="size-4" />
              </span>
              <p className="text-sm leading-relaxed">{m("insight")}</p>
            </div>
          </FeatureCard>
        </ul>
      </div>
    </section>
  );
}

/* ───────── Customer experience ───────── */

export function CustomerFlow({ qrSvg }: { qrSvg: string }) {
  const t = useTranslations("home.customer");
  const points = [
    { key: "noApp", Icon: Smartphone },
    { key: "bilingual", Icon: Languages },
    { key: "private", Icon: ShieldCheck },
    { key: "fast", Icon: Timer },
  ] as const;
  const phones = [
    { key: "scan", screen: <ScanScreen qrSvg={qrSvg} />, offset: "lg:translate-y-10" },
    { key: "answer", screen: <SurveyScreen />, offset: "" },
    { key: "done", screen: <ThanksScreen />, offset: "lg:translate-y-10" },
  ] as const;
  return (
    <section className="relative overflow-hidden bg-ink text-sand">
      <Supergraphic colors={["#161F9E", "#2B3AF3", "#161F9E"]} className="-end-40 -top-20 h-[130%] w-[60%] opacity-40" />
      <div className="relative mx-auto flex w-full max-w-[1216px] flex-col gap-14 px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} body={t("body")} dark />
        <ol className="grid gap-10 sm:grid-cols-3">
          {phones.map((p, i) => (
            <li key={p.key} className={cn("flex flex-col items-center gap-5", p.offset)}>
              <PhoneFrame className="h-[420px] w-[210px] border-ink-600">{p.screen}</PhoneFrame>
              <span className="flex items-center gap-2 font-display text-lg font-bold">
                <span className="slice-sm bg-zest px-2 text-sm text-ink">{formatNumber("en", i + 1)}</span>
                {t(`steps.${p.key}`)}
              </span>
            </li>
          ))}
        </ol>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {points.map(({ key, Icon }) => (
            <li key={key} className="flex items-center gap-3 rounded-[16px] border border-ink-700 bg-ink-800 px-4 py-3.5 font-semibold">
              <Icon aria-hidden strokeWidth={1.75} className="size-5 shrink-0 text-zest" />
              {t(`points.${key}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ───────── Dashboard showcase ───────── */

export function Showcase({ host }: { host: string }) {
  const t = useTranslations("home.showcase");
  const m = useTranslations("home.mock");
  const locale = useLocale() as Locale;
  const kpis = [
    { label: m("responses"), value: formatCount(locale, 2140), delta: formatPercent(locale, 0.12, 0) },
    { label: m("csat"), value: formatPercent(locale, 0.924, 1), delta: formatNumber(locale, 3.1, { signDisplay: "always" }) },
    { label: m("nps"), value: formatNumber(locale, 48, { signDisplay: "always" }), delta: formatNumber(locale, 6, { signDisplay: "always" }) },
  ];
  const branches = [
    { name: m("locationA"), n: 912, ratio: 0.94 },
    { name: m("locationB"), n: 784, ratio: 0.81 },
    { name: m("locationC"), n: 444, ratio: 0.67 },
  ];
  return (
    <section className="relative overflow-hidden bg-sand">
      <div className="mx-auto flex w-full max-w-[1216px] flex-col gap-12 px-4 py-20 sm:px-6 lg:py-28">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} body={t("body")} center />
        <div className="relative">
          <span aria-hidden className="slice-lg absolute -start-6 top-10 hidden h-12 w-48 bg-ember lg:block" />
          <span aria-hidden className="slice-lg absolute -end-6 bottom-16 hidden h-12 w-56 bg-ultramarine lg:block" />
          <BrowserFrame address={`${host}/dashboard`} className="relative mx-auto max-w-5xl">
            <div className="grid gap-0 md:grid-cols-[180px_minmax(0,1fr)]">
              <div className="hidden flex-col gap-1 border-e border-border bg-sand-50 p-4 text-sm md:flex">
                <SatisMark tone="ink-ultra" className="mb-4 h-6 w-auto self-start" />
                <span className="rounded-[10px] bg-sand-100 px-3 py-2 font-semibold">{m("dashboard")}</span>
                <span className="px-3 py-2 text-muted-foreground">{m("inbox")}</span>
                <span className="px-3 py-2 text-muted-foreground">{m("surveys")}</span>
                <span className="px-3 py-2 text-muted-foreground">{m("branches")}</span>
              </div>
              <div className="flex flex-col gap-4 bg-sand p-4 sm:p-6">
                <div className="grid grid-cols-3 gap-3">
                  {kpis.map((k) => (
                    <div key={k.label} className="flex flex-col gap-1 rounded-[14px] border border-border bg-white p-3 sm:p-4">
                      <span className="truncate text-xs text-muted-foreground">{k.label}</span>
                      <span className="font-display text-xl font-extrabold tracking-[-0.03em] sm:text-3xl">{k.value}</span>
                      <span className="w-fit rounded-full bg-mint-50 px-1.5 text-[11px] font-semibold text-mint-700">{k.delta}</span>
                    </div>
                  ))}
                </div>
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                  <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-white p-4">
                    <span className="text-sm font-semibold">{m("responsesPerDay")}</span>
                    <SlantedBars heights={[30, 45, 38, 52, 48, 66, 58, 72, 64, 80, 70, 88, 76, 94]} className="h-32" />
                  </div>
                  <div className="flex flex-col gap-3 rounded-[14px] border border-border bg-white p-4">
                    <span className="text-sm font-semibold">{m("branches")}</span>
                    {branches.map((b) => (
                      <div key={b.name} className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium">{b.name}</span>
                          <span className="text-muted-foreground">{formatCount(locale, b.n)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-ultra-50">
                          <div className="h-full rounded-full bg-ultramarine" style={{ width: `${b.ratio * 100}%` }} />
                        </div>
                      </div>
                    ))}
                    <Sparkline className="mt-auto" color="#2B3AF3" />
                  </div>
                </div>
              </div>
            </div>
          </BrowserFrame>
        </div>
      </div>
    </section>
  );
}

/* ───────── Pricing ───────── */

export function Pricing() {
  const t = useTranslations("home.pricing");
  const locale = useLocale() as Locale;
  const items = ["surveys", "qr", "inbox", "analytics", "team", "support"] as const;
  return (
    <section id="pricing" className="scroll-mt-20 bg-white">
      <div className="mx-auto grid w-full max-w-[1216px] items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <div className="flex flex-col gap-6">
          <SectionHeading eyebrow={t("eyebrow")} title={t("title")} body={t("subtitle")} />
          <SpeedLines className="hidden max-w-xs lg:flex" />
        </div>
        <div className="relative">
          <span aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 rounded-[28px] bg-ember rtl:-translate-x-3" />
          <div className="relative flex flex-col gap-6 rounded-[28px] border-[3px] border-ink bg-white p-8">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold">{t("plan")}</h3>
              <SatisMark tone="ink-ultra" className="h-7 w-auto" />
            </div>
            <div className="flex flex-wrap items-baseline gap-2">
              <span className="font-display text-6xl font-extrabold tracking-[-0.045em]">{formatSar(locale, LAUNCH_PRICE_HALALAS)}</span>
              <span className="text-lg font-semibold text-muted-foreground">{t("perMonth")}</span>
            </div>
            <p className="-mt-4 text-sm text-muted-foreground">{t("vat")}</p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {items.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-mint-50 text-mint-600">
                    <Check aria-hidden strokeWidth={2.5} className="size-3.5" />
                  </span>
                  {t(`includes.${item}`)}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" className="h-14 rounded-[12px] text-base">
              <Link href="/signup">{t("cta")}</Link>
            </Button>
            <p className="rounded-[12px] bg-sand-100 px-4 py-3 text-sm">{t("note")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────── FAQ ───────── */

export function Faq() {
  const t = useTranslations("home.faq");
  const items = ["app", "arabic", "branches", "edit", "privacy", "setup"] as const;
  return (
    <section id="faq" className="scroll-mt-20 bg-sand">
      <div className="mx-auto grid w-full max-w-[1216px] gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:py-28">
        <SectionHeading eyebrow={t("eyebrow")} title={t("title")} />
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <details key={item} className="group rounded-card border border-border bg-white open:border-ink-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-card px-6 py-5 text-lg font-semibold outline-none focus-visible:shadow-focus [&::-webkit-details-marker]:hidden">
                {t(`items.${item}.q`)}
                <span aria-hidden className="flex size-8 shrink-0 items-center justify-center rounded-full bg-sand-100 transition-transform duration-[200ms] group-open:rotate-45">
                  <Plus strokeWidth={1.75} className="size-4" />
                </span>
              </summary>
              <p className="px-6 pb-6 leading-relaxed text-muted-foreground">{t(`items.${item}.a`)}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────── Final call to action and footer ───────── */

export function FinalCta() {
  const t = useTranslations("home.finalCta");
  const m = useTranslations("home.mock");
  const locale = useLocale() as Locale;
  return (
    <section className="bg-sand px-4 pb-20 sm:px-6">
      <div className="relative mx-auto grid w-full max-w-[1216px] items-center gap-10 overflow-hidden rounded-[40px] bg-ember px-8 py-14 text-ink sm:px-14 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Supergraphic colors={["#0B0D12", "#FFCF28", "#0B0D12"]} className="-end-24 -bottom-24 h-[120%] w-[45%] opacity-90" />
        <div className="relative flex flex-col gap-5">
          <h2 className="text-[clamp(32px,4.4vw,56px)] leading-[1.05] font-extrabold">{t("title")}</h2>
          <p className="text-lg">{t("body")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-14 rounded-[12px] bg-ink px-7 text-[17px] font-bold text-sand hover:bg-ink-800">
              <Link href="/signup">{t("primary")}</Link>
            </Button>
            <Button asChild variant="outline" className="h-14 rounded-[12px] border-[1.5px] border-ink bg-transparent px-6 text-base hover:bg-ember-600/30">
              <Link href="/login">{t("secondary")}</Link>
            </Button>
          </div>
        </div>
        <div aria-hidden className="relative hidden justify-self-center lg:block">
          <OutlinedCard className="flex w-64 animate-float flex-col gap-3">
            <span className="text-xs text-muted-foreground">{m("store")}</span>
            <span className="font-display text-5xl font-extrabold tracking-[-0.04em]">{formatNumber(locale, 4.8)}</span>
            <MiniRating value={5} />
            <SliceHighlight tone="ink" className="w-fit text-sm">{m("topRated")}</SliceHighlight>
          </OutlinedCard>
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  const t = useTranslations("home");
  const locale = useLocale() as Locale;
  return (
    <footer className="bg-ink text-ink-200">
      <div className="mx-auto flex w-full max-w-[1216px] flex-col gap-10 px-4 py-14 sm:px-6">
        <div className="flex flex-col justify-between gap-10 sm:flex-row">
          <div className="flex flex-col gap-3">
            <SatisMark tone="sand-zest" className="h-10 w-auto self-start" />
            <p className="font-display text-xl font-bold text-sand">{t("tagline")}</p>
          </div>
          <div className="grid grid-cols-2 gap-10 text-sm">
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-sand">{t("footer.product")}</span>
              <a href="#how" className="hover:text-sand">{t("nav.how")}</a>
              <a href="#features" className="hover:text-sand">{t("nav.features")}</a>
              <a href="#pricing" className="hover:text-sand">{t("nav.pricing")}</a>
              <a href="#faq" className="hover:text-sand">{t("nav.faq")}</a>
            </div>
            <div className="flex flex-col gap-3">
              <span className="font-semibold text-sand">{t("footer.account")}</span>
              <Link href="/signup" className="hover:text-sand">{t("footer.signup")}</Link>
              <Link href="/login" className="hover:text-sand">{t("nav.logIn")}</Link>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 border-t border-ink-700 pt-6 text-sm text-ink-300">
          <ScanLine aria-hidden strokeWidth={1.75} className="size-4" />
          {t("footer.rights", { year: formatNumber(locale, new Date().getFullYear(), { useGrouping: false }) })}
        </div>
      </div>
    </footer>
  );
}
