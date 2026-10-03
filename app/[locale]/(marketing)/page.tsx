import { getTranslations } from "next-intl/server";
import { Hero } from "@/components/marketing/hero";
import { CustomerFlow, Faq, Features, FinalCta, HowItWorks, Industries, Pricing, Showcase, SiteFooter } from "@/components/marketing/sections";
import { SiteHeader } from "@/components/marketing/site-header";
import { publicEnv } from "@/lib/env/public";
import { resolveLocale } from "@/lib/i18n/server";
import { qrSvg } from "@/lib/qr";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const [t, ar, en, qr] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale: "ar", namespace: "surveyTemplate" }),
    getTranslations({ locale: "en", namespace: "surveyTemplate" }),
    // A real, scannable code: it opens this page.
    qrSvg(publicEnv.NEXT_PUBLIC_SITE_URL),
  ]);

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <div className="bg-ultramarine px-4 py-3 text-center text-sm font-semibold text-white">{t("announcement")}</div>
      <SiteHeader />
      <main id="content" className="flex-1">
        <Hero />
        <Industries />
        <HowItWorks qrSvg={qr} />
        <Features qrSvg={qr} question={{ ar: ar("rating"), en: en("rating") }} />
        <CustomerFlow qrSvg={qr} />
        <Showcase host={new URL(publicEnv.NEXT_PUBLIC_SITE_URL).host} />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
