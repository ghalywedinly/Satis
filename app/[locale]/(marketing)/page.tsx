import { CustomerFlow, Faq, Features, FinalCta, Hero, HowItWorks, PlansTeaser } from "@/components/marketing/home";
import { BadgeStory, Benefits, CaseStudies, Problem, Solution } from "@/components/marketing/story";
import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";
import { publicEnv } from "@/lib/env/public";
import { resolveLocale } from "@/lib/i18n/server";
import { qrSvg } from "@/lib/qr";

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  // Validates the locale and sets it for this request.
  await resolveLocale(params);
  // A real, scannable code: it opens this page.
  const qr = await qrSvg(publicEnv.NEXT_PUBLIC_SITE_URL);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <SiteHeader />
      <main id="content" className="flex-1">
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <CustomerFlow qrSvg={qr} />
        <Benefits />
        <CaseStudies />
        <BadgeStory />
        <Features />
        <PlansTeaser />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
