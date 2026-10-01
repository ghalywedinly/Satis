import { getTranslations } from "next-intl/server";
import { AnalyticsIdentity } from "@/components/app-shell/analytics-identity";
import { SatisLogo } from "@/components/brand/satis-mark";
import { UserMenu } from "@/components/app-shell/user-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getProfile, requireUser } from "@/lib/auth/session";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";

/** Shell for every signed-in page. The proxy already redirects signed-out visitors; this re-checks on the server. */
export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const user = await requireUser(locale);
  const profile = await getProfile(user.id);
  const t = await getTranslations({ locale, namespace: "common" });

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <AnalyticsIdentity userId={user.id} />
      <a
        href="#content"
        className="sr-only z-50 rounded-control bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:shadow-focus"
      >
        {t("skipToContent")}
      </a>
      <header className="border-b border-border bg-white">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" aria-label={t("appName")} className="rounded-control outline-none focus-visible:shadow-focus">
              <SatisLogo size={22} tone="ink-ultra" locale={locale} />
            </Link>
            <nav aria-label={t("nav.mainNavigation")} className="hidden sm:block">
              <Link href="/dashboard" className="text-sm font-semibold text-ink">
                {t("nav.dashboard")}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-1">
            <LanguageSwitcher persist />
            <UserMenu name={profile?.full_name ?? null} email={user.email} />
          </div>
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {children}
      </main>
    </div>
  );
}
