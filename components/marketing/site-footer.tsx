import { useLocale, useTranslations } from "next-intl";
import { SatisLogo, SatisMark } from "@/components/brand/satis-mark";
import { formatNumber } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

/** Ink footer for the public site: tagline, links and a large quiet S-mark in the corner. */
export function SiteFooter() {
  const t = useTranslations("home");
  const locale = useLocale() as Locale;
  const link = "rounded-xs text-ink-300 outline-none transition-colors hover:text-white focus-visible:shadow-focus";
  return (
    <footer className="relative overflow-hidden bg-ink text-ink-300">
      <div className="relative z-10 mx-auto flex w-full max-w-[1240px] flex-col gap-12 px-4 pt-16 pb-9 sm:px-6">
        <div className="flex flex-wrap gap-12">
          <div className="flex flex-[1.4_1_260px] flex-col gap-3.5">
            <SatisLogo tone="zest" locale={locale} size={24} />
            <p className="text-xl font-bold text-white">{t("tagline")}</p>
          </div>
          <nav aria-label={t("footer.product")} className="flex flex-[1_1_140px] flex-col gap-3 text-[15px]">
            <span className="font-semibold text-white">{t("footer.product")}</span>
            <Link href="/#how" className={link}>
              {t("nav.how")}
            </Link>
            <Link href="/#features" className={link}>
              {t("nav.features")}
            </Link>
            <Link href="/pricing" className={link}>
              {t("nav.pricing")}
            </Link>
            <Link href="/score" className={link}>
              {t("nav.score")}
            </Link>
            <Link href="/#faq" className={link}>
              {t("nav.faq")}
            </Link>
            <Link href="/blog" className={link}>
              {t("nav.blog")}
            </Link>
          </nav>
          <nav aria-label={t("footer.account")} className="flex flex-[1_1_140px] flex-col gap-3 text-[15px]">
            <span className="font-semibold text-white">{t("footer.account")}</span>
            <Link href="/signup" className={link}>
              {t("footer.signup")}
            </Link>
            <Link href="/login" className={link}>
              {t("nav.logIn")}
            </Link>
            <Link href="/book" className={link}>
              {t("nav.start")}
            </Link>
          </nav>
        </div>
        <p className="border-t border-ink-700 pt-5 text-[13px]">{t("footer.rights", { year: formatNumber(locale, new Date().getFullYear(), { useGrouping: false }) })}</p>
      </div>
      <span aria-hidden className="pointer-events-none absolute -end-20 -bottom-56">
        <SatisMark tone="ink" className="h-[480px] [&_polygon]:fill-ink-800" />
      </span>
    </footer>
  );
}
