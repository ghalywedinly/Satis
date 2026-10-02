import { ArrowDown, Bell, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SatisMark } from "@/components/brand/satis-mark";
import { OutlinedCard, OutlinedPill } from "@/components/brand/slice";
import { Button } from "@/components/ui/button";
import { formatNumber, formatPercent } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { MiniRating, PhoneFrame, PillBar, Sparkline } from "./mockups";
import { Rotating } from "./motion";
import { SurveyScreen } from "./phone-screens";

export function Hero() {
  const t = useTranslations("home");
  return (
    <section className="relative overflow-hidden bg-ink text-sand">
      <div className="mx-auto grid w-full max-w-[1216px] items-center gap-12 px-4 pt-10 pb-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:pt-16 lg:pb-24">
        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="eyebrow !text-ink-300">{t("eyebrow")}</span>
          <h1 className="text-[clamp(40px,5vw,68px)] leading-[1.04] font-extrabold tracking-[-0.045em] text-sand">{t("headline")}</h1>
          <p className="font-display text-2xl font-bold text-zest sm:text-3xl">{t("tagline")}</p>
          <p className="max-w-[520px] text-lg leading-relaxed text-ink-200 sm:text-[19px]">{t("body")}</p>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="h-14 rounded-[12px] bg-zest px-7 text-[17px] font-bold text-ink hover:bg-zest-500">
              <Link href="/signup">{t("primaryCta")}</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-14 rounded-[12px] border-[1.5px] border-ink-600 bg-transparent px-6 text-base text-sand hover:bg-ink-800 hover:text-sand"
            >
              <a href="#how">
                {t("secondaryCta")}
                <ArrowDown aria-hidden strokeWidth={1.75} />
              </a>
            </Button>
          </div>
          <p className="text-sm text-ink-300">{t("heroNote")}</p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

/** The product, floating: the customer's phone, and what the business sees as answers arrive. */
function HeroVisual() {
  const t = useTranslations("home.mock");
  const locale = useLocale() as Locale;
  return (
    <div aria-hidden className="relative mx-auto h-[520px] w-full max-w-[580px] sm:h-[580px]">
      {/* Brand shapes: two Ember slices bleeding off the bottom corner, one Ultramarine slice at the top. */}
      <svg viewBox="8 30 92 60" preserveAspectRatio="xMaxYMax slice" className="absolute -end-10 -bottom-20 h-[72%] w-[95%]">
        <polygon points="11.1,34 57.1,34 94.9,58 48.9,58" fill="#FF6B4A" />
        <polygon points="66,88 8,88 37.7,62 95.7,62" fill="#FF6B4A" />
      </svg>
      <svg viewBox="30 2 70 30" preserveAspectRatio="xMaxYMin slice" className="absolute -end-10 top-2 h-16 w-[46%]">
        <polygon points="40,4 98,4 68.3,30 10.3,30" fill="#2B3AF3" />
      </svg>

      <PhoneFrame className="absolute start-[4%] top-10 z-10 h-[440px] w-[220px] animate-float-slow sm:h-[480px] sm:w-[240px]">
        <SurveyScreen />
      </PhoneFrame>

      <OutlinedCard className="absolute end-0 top-16 z-20 flex w-[260px] max-w-[62%] animate-float flex-col gap-3 p-5 sm:end-[2%]">
        <span className="text-xs text-muted-foreground">{t("store")}</span>
        <div className="flex items-baseline gap-2">
          <span className="font-display text-5xl leading-none font-extrabold tracking-[-0.04em]">{formatNumber(locale, 4.7)}</span>
          <span className="text-sm font-semibold text-muted-foreground">{t("csatOf")}</span>
        </div>
        <MiniRating value={5} />
        <div className="flex flex-col border-t border-sand-100 text-[13px]">
          <span className="flex justify-between border-b border-sand-100 py-2.5">
            <span className="font-medium">{t("speed")}</span>
            <span className="text-muted-foreground">{t("good")}</span>
          </span>
          <span className="flex items-center justify-between border-b border-sand-100 py-2.5">
            <span className="font-medium">{t("staff")}</span>
            <span className="slice-sm bg-zest px-2.5 py-0.5 text-xs font-bold">{t("excellent")}</span>
          </span>
          <span className="flex justify-between py-2.5">
            <span className="font-medium">{t("wait")}</span>
            <span className="font-semibold text-ember-700">{t("improve")}</span>
          </span>
        </div>
      </OutlinedCard>

      <OutlinedPill className="absolute end-[30%] top-0 z-30 animate-float">
        <SatisMark tone="ink" className="h-3.5 w-auto" />
        {t("topRated")}
        <span className="size-2 rounded-full bg-mint animate-pulse-dot" />
      </OutlinedPill>

      <OutlinedCard className="absolute start-[26%] bottom-[24%] z-30 hidden w-[190px] sm:flex animate-float-slow flex-col gap-2.5 rounded-[18px] p-4 [animation-delay:-3s]">
        <span className="text-[13px] font-bold">{t("sentimentToday")}</span>
        <PillBar label={t("positive")} value={formatPercent(locale, 0.83, 0)} ratio={0.83} color="bg-mint" />
        <PillBar label={t("negative")} value={formatPercent(locale, 0.04, 0)} ratio={0.04} color="bg-ember" />
      </OutlinedCard>

      <OutlinedCard className="absolute end-0 bottom-4 z-20 hidden w-[200px] sm:flex animate-float flex-col gap-1 rounded-[18px] p-4 [animation-delay:-2s] sm:end-[2%]">
        <span className="font-display text-3xl leading-none font-extrabold tracking-[-0.04em]">
          {formatNumber(locale, 23, { signDisplay: "always" })} <span className="text-[0.5em] text-muted-foreground">{t("npsLabel")}</span>
        </span>
        <span className="text-[13px] text-muted-foreground">{t("in90Days")}</span>
        <Sparkline className="mt-1.5" />
      </OutlinedCard>

      <div className="absolute start-0 bottom-0 z-30 flex w-[230px] animate-float items-center gap-3 rounded-[16px] border-2 border-ink bg-white p-3 text-ink [animation-delay:-4s]">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-ultra-50 text-ultramarine">
          <Bell strokeWidth={1.75} className="size-4" />
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-xs font-bold">
            {t("newResponse")}
            <Star className="size-3 fill-zest text-zest-600" />
            <span className="font-normal text-muted-foreground">{t("justNow")}</span>
          </span>
          <Rotating items={[t("comment1"), t("comment3"), t("comment4")]} className="text-xs text-ink-600" />
        </span>
      </div>
    </div>
  );
}
