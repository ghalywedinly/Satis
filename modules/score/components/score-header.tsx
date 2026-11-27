import { useLocale, useTranslations } from "next-intl";
import { SatisLogo } from "@/components/brand/satis-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";

/** Header for the public Satis Score pages: Satis logo, the Satis Score name and its sections. */
export function ScoreHeader() {
  const t = useTranslations("score.nav");
  const locale = useLocale() as Locale;
  const links = [
    { href: "/score#categories", label: t("categories") },
    { href: "/score#top", label: t("top") },
    { href: "/score#seal", label: t("seal") },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white">
      <div className="mx-auto flex w-full max-w-[1288px] items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="shrink-0 rounded-control outline-none focus-visible:shadow-focus">
            <SatisLogo size={22} tone="zest-ink" locale={locale} />
          </Link>
          <span aria-hidden className="h-5 w-px bg-ink-100" />
          <Link href="/score" aria-label={t("home")} className="rounded-xs text-[15px] font-semibold whitespace-nowrap outline-none focus-visible:shadow-focus">
            {t("label")}
          </Link>
        </div>
        <nav aria-label={t("label")} className="hidden items-center gap-7 text-[15px] lg:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded-xs outline-none transition-colors hover:text-ink-500 focus-visible:shadow-focus">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <Button asChild variant="outline" className="hidden h-[42px] border-ink sm:inline-flex">
            <Link href="/">{t("forBusiness")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
