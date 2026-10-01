"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SatisLogo } from "@/components/brand/satis-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/** Sticky marketing header on Ink. Gains a hairline border once the page scrolls. */
export function SiteHeader() {
  const t = useTranslations("home.nav");
  const locale = useLocale() as Locale;
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#how", label: t("how") },
    { href: "#features", label: t("features") },
    { href: "#pricing", label: t("pricing") },
    { href: "#faq", label: t("faq") },
  ];

  return (
    <header className={cn("sticky top-0 z-40 bg-ink transition-[border-color] duration-[140ms]", scrolled ? "border-b border-ink-700" : "border-b border-transparent")}>
      <div className="mx-auto flex w-full max-w-[1216px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" aria-label={t("home")} className="shrink-0 rounded-control outline-none focus-visible:shadow-focus">
          <SatisLogo size={26} tone="sand-zest" locale={locale} />
        </Link>
        <nav aria-label={t("label")} className="hidden items-center gap-7 text-[15px] font-medium text-ink-200 lg:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="rounded-xs outline-none transition-colors hover:text-sand focus-visible:shadow-focus">
              {link.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSwitcher className="text-sand hover:bg-ink-800 hover:text-sand" />
          <Button asChild variant="outline" className="h-[42px] border-[1.5px] border-sand bg-transparent text-sand hover:bg-ink-800 hover:text-sand">
            <Link href="/login">{t("logIn")}</Link>
          </Button>
          <Button asChild className="hidden h-[42px] bg-sand text-ink hover:bg-sand-200 sm:inline-flex">
            <Link href="/signup">{t("start")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
