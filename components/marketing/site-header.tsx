"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { SatisLogo } from "@/components/brand/satis-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link, usePathname } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";

/** Sticky white marketing header. Gains a hairline border once the page scrolls. */
export function SiteHeader() {
  const t = useTranslations("home.nav");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Section links point at the home page so they also work from other pages.
  const links = [
    { href: "/#how", label: t("how") },
    { href: "/#features", label: t("features") },
    { href: "/pricing", label: t("pricing") },
    { href: "/#faq", label: t("faq") },
    { href: "/blog", label: t("blog") },
  ];

  return (
    <header className={cn("sticky top-0 z-40 bg-white transition-[border-color] duration-[140ms]", scrolled ? "border-b border-ink-100" : "border-b border-transparent")}>
      <div className="mx-auto flex w-full max-w-[1288px] items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" aria-label={t("home")} className="shrink-0 rounded-control outline-none focus-visible:shadow-focus">
          <SatisLogo size={24} tone="zest-ink" locale={locale} />
        </Link>
        <nav aria-label={t("label")} className="hidden items-center gap-7 text-[15px] lg:flex">
          {links.map((link) => {
            const active = link.href === pathname;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={cn("rounded-xs outline-none transition-colors hover:text-ink-500 focus-visible:shadow-focus", active && "font-bold underline decoration-zest decoration-2 underline-offset-8")}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <LanguageSwitcher />
          <Button asChild variant="ghost" className="h-[42px]">
            <Link href="/login">{t("logIn")}</Link>
          </Button>
          <Button asChild className="hidden h-[42px] sm:inline-flex">
            <Link href="/book">{t("start")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
