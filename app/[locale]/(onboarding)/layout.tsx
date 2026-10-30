import { getTranslations } from "next-intl/server";
import { SatisLogo } from "@/components/brand/satis-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/app-shell/user-menu";
import { getProfile, requireUser } from "@/lib/auth/session";
import { resolveLocale } from "@/lib/i18n/server";

/** Focused, distraction-free frame for setting up a business. */
export default async function OnboardingLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const user = await requireUser(locale);
  const profile = await getProfile(user.id);
  const t = await getTranslations({ locale, namespace: "common" });
  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-5 sm:px-6">
        <span aria-label={t("appName")}>
          <SatisLogo size={24} tone="ink-ultra" locale={locale} />
        </span>
        <div className="flex items-center gap-1">
          <LanguageSwitcher persist />
          <UserMenu name={profile?.full_name ?? null} email={user.email} />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-4 pb-12 sm:px-6 sm:pt-10">{children}</main>
    </div>
  );
}
