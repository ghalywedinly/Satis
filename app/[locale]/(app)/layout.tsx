import { getTranslations } from "next-intl/server";
import { AnalyticsIdentity } from "@/components/app-shell/analytics-identity";
import { MainNav, type NavItem } from "@/components/app-shell/main-nav";
import { OrgSwitcher } from "@/components/app-shell/org-switcher";
import { UserMenu } from "@/components/app-shell/user-menu";
import { SatisMark } from "@/components/brand/satis-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getProfile } from "@/lib/auth/session";
import { formatCount } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { getMemberships, requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { countUnread } from "@/modules/feedback/queries";

/**
 * Shell for every page inside a business. The proxy already redirects signed-out visitors;
 * this re-checks on the server and sends people without a business to onboarding.
 */
export default async function AppLayout({ children, params }: LayoutProps<"/[locale]">) {
  const locale = await resolveLocale(params);
  const { user, membership } = await requireMembership(locale);
  const [profile, memberships, t, unread] = await Promise.all([
    getProfile(user.id),
    getMemberships(),
    getTranslations({ locale, namespace: "common" }),
    countUnread(membership.organization.id),
  ]);

  const nav: NavItem[] = [
    { href: "/dashboard", label: "dashboard" },
    { href: "/inbox", label: "inbox", badge: unread > 0 ? formatCount(locale, Math.min(unread, 99)) + (unread > 99 ? "+" : "") : undefined },
    { href: "/surveys", label: "surveys" },
    { href: "/coupons", label: "coupons" },
    { href: "/locations", label: "locations" },
    { href: "/team", label: "team" },
    ...(can(membership.role, "organization.edit") ? [{ href: "/settings", label: "settings" } as const] : []),
  ];

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <AnalyticsIdentity userId={user.id} />
      <a
        href="#content"
        className="sr-only z-50 rounded-control print:hidden bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:shadow-focus"
      >
        {t("skipToContent")}
      </a>
      <header className="border-b border-border bg-white print:hidden">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Link href="/dashboard" aria-label={t("appName")} className="shrink-0 rounded-control p-1 outline-none focus-visible:shadow-focus">
                <SatisMark tone="ink-ultra" className="h-6" />
              </Link>
              <span aria-hidden className="text-ink-200">
                /
              </span>
              <OrgSwitcher
                current={{ id: membership.organization.id, name: membership.organization.name }}
                organizations={memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }))}
              />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <LanguageSwitcher persist />
              <UserMenu name={profile?.full_name ?? null} email={user.email} />
            </div>
          </div>
          <MainNav items={nav} />
        </div>
      </header>
      <main id="content" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10 print:p-0">
        {children}
      </main>
    </div>
  );
}
