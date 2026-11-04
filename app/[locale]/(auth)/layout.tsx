import { getTranslations } from "next-intl/server";
import { SatisLogo } from "@/components/brand/satis-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";

export default async function AuthLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "common" });
  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <Link href="/" aria-label={t("appName")} className="rounded-control outline-none focus-visible:shadow-focus">
          <SatisLogo size={26} tone="ink-ultra" locale={locale} />
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">
        <div className="w-full max-w-[420px]">{children}</div>
      </main>
    </div>
  );
}
