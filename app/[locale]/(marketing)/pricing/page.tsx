import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SatisMark } from "@/components/brand/satis-mark";
import { SatisSeal } from "@/components/brand/seal";
import { FinalCta } from "@/components/marketing/home";
import { BUNDLE_DISCOUNT, FOUNDERS_PRICE, VISITS_GROWTH } from "@/components/marketing/plans";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { formatPercent, formatSar } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { Layers, MapPin, MessageCircle } from "lucide-react";

export async function generateMetadata({ params }: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pricing" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PricingPage({ params }: PageProps<"/[locale]/pricing">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "pricing" });
  const extras = [
    { key: "whatsapp", Icon: MessageCircle, tone: "bg-mint", price: t("extras.whatsapp.price") },
    { key: "bundle", Icon: Layers, tone: "bg-zest", price: t("extras.bundle.price", { percent: formatPercent(locale, BUNDLE_DISCOUNT, 0) }) },
    { key: "branch", Icon: MapPin, tone: "bg-ember", price: t("extras.branch.price", { price: formatSar(locale, VISITS_GROWTH.perExtra * 100) }) },
  ] as const;
  const faq = ["card", "change", "limit", "vat"] as const;

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader />
      <main id="content" className="flex-1">
        <section className="px-3 sm:px-6">
          <div className="mx-auto flex max-w-[1240px] flex-col items-center gap-6 rounded-[32px] bg-ink px-6 py-16 text-center text-white sm:rounded-[40px] sm:px-16 sm:py-20">
            <span className="inline-flex items-center gap-2 rounded-full bg-zest py-1.5 ps-1.5 pe-3.5 text-[13px] font-semibold text-ink">
              <span aria-hidden className="flex size-[22px] items-center justify-center rounded-full bg-ink">
                <SatisMark tone="zest" className="h-2.5" />
              </span>
              {t("badge")}
            </span>
            <h1 className="text-[clamp(38px,5.5vw,56px)] leading-[1.35] font-bold">{t.rich("title", { hl: (chunks) => <span className="text-zest">{chunks}</span> })}</h1>
            <p className="max-w-[52ch] text-lg leading-[1.85] text-ink-200">{t("body")}</p>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1240px] px-4 pt-12 sm:px-6">
          <PricingPlans />
        </div>

        <section aria-labelledby="extras-heading" className="mx-auto flex w-full max-w-[1240px] flex-col gap-6 px-4 pt-24 sm:px-6">
          <h2 id="extras-heading" className="text-[clamp(28px,3.5vw,36px)] font-bold">
            {t("extras.title")}
          </h2>
          <ul className="grid gap-4 md:grid-cols-3">
            {extras.map(({ key, Icon, tone, price }) => (
              <li key={key} className="flex flex-col gap-3 rounded-[24px] border border-ink-100 p-6">
                <span aria-hidden className={cn("flex size-11 items-center justify-center rounded-tile text-ink", tone)}>
                  <Icon strokeWidth={1.75} className="size-5" />
                </span>
                <h3 className="font-sans text-lg font-bold">{t(`extras.${key}.title`)}</h3>
                <p className="text-sm leading-[1.8] text-ink-600">{t(`extras.${key}.body`)}</p>
                <p className="mt-auto font-bold">{price}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="px-3 pt-16 sm:px-6">
          <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-6 rounded-[32px] bg-zest p-8 text-ink sm:p-10">
            <SatisSeal className="size-[72px] [&_polygon:first-child]:fill-ink [&_g]:fill-zest" />
            <div className="flex flex-[1_1_380px] flex-col gap-1.5">
              <h2 className="font-sans text-2xl font-bold">{t("founders.title", { price: formatSar(locale, FOUNDERS_PRICE * 100) })}</h2>
              <p className="leading-[1.8]">{t("founders.body")}</p>
            </div>
            <Button asChild size="lg" className="h-[52px] rounded-[12px] bg-ink px-6 text-base text-white hover:bg-ink-700">
              <Link href="/book">{t("founders.cta")}</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto grid w-full max-w-[1240px] gap-10 px-4 pt-24 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
          <div className="flex flex-col gap-2.5">
            <span className="text-sm font-bold text-ink-500">{t("faq.eyebrow")}</span>
            <h2 className="text-[clamp(28px,3.5vw,36px)] font-bold">{t("faq.title")}</h2>
          </div>
          <div className="flex flex-col">
            {faq.map((item) => (
              <details key={item} className="group border-t border-ink-100 py-5">
                <summary className="flex cursor-pointer list-none items-center gap-4 rounded-sm text-lg font-bold outline-none focus-visible:shadow-focus [&::-webkit-details-marker]:hidden">
                  <span className="flex-1">{t(`faq.items.${item}.q`)}</span>
                  <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="size-5 shrink-0 transition-transform duration-[200ms] group-open:rotate-180">
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </summary>
                <p className="mt-3 max-w-[60ch] leading-[1.85] text-ink-600">{t(`faq.items.${item}.a`)}</p>
              </details>
            ))}
          </div>
        </section>

        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
