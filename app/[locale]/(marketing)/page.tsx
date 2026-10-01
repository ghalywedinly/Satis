import { getTranslations } from "next-intl/server";
import { SatisLogo } from "@/components/brand/satis-mark";
import { SliceHighlight, SpeedLines } from "@/components/brand/slice";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";

// Placeholder until the full landing page (spec §23) is built.
export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale });

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <SatisLogo size={28} tone="ink-ultra" locale={locale} />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <Button asChild variant="ghost">
            <Link href="/login">{t("common.actions.logIn")}</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-4 pb-16 sm:px-6">
        <div className="flex max-w-3xl flex-col gap-5">
          <p className="eyebrow">{t("home.eyebrow")}</p>
          <h1 className="text-[clamp(40px,6vw,76px)] leading-[1.05] font-extrabold">{t("home.headline")}</h1>
          <p className="text-xl font-semibold sm:text-2xl">
            <SliceHighlight>{t("home.tagline")}</SliceHighlight>
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/signup">{t("home.primaryCta")}</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/login">{t("home.secondaryCta")}</Link>
          </Button>
        </div>
        <SpeedLines className="max-w-md" />
      </main>
    </div>
  );
}
