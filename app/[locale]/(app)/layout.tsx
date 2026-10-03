import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { AnalyticsIdentity } from "@/components/app-shell/analytics-identity";
import { AppFrame } from "@/components/app-shell/app-frame";
import { SIDEBAR_COOKIE } from "@/components/app-shell/sidebar-cookie";
import { type NavItem } from "@/components/app-shell/main-nav";
import { Supergraphic } from "@/components/brand/slice";
import { getProfile } from "@/lib/auth/session";
import { formatCount } from "@/lib/i18n/format";
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
  const [profile, memberships, t, unread, cookieStore] = await Promise.all([
    getProfile(user.id),
    getMemberships(),
    getTranslations({ locale, namespace: "common" }),
    countUnread(membership.organization.id),
    cookies(),
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
    <div className="app-glass relative isolate flex min-h-dvh flex-col">
      {/* Fixed brand wash behind the glass, with a faint giant mark cropped off the edge. */}
      <div aria-hidden className="app-backdrop fixed inset-0 -z-10 overflow-hidden print:hidden">
        <Supergraphic colors={["#2B3AF3", "#FF6B4A", "#2B3AF3"]} className="-end-24 -bottom-24 h-[70vh] w-[46vh] opacity-[0.06] rtl:-scale-x-100" />
      </div>
      <AnalyticsIdentity userId={user.id} />
      <a
        href="#content"
        className="sr-only z-50 rounded-control print:hidden bg-white px-3 py-2 focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:shadow-focus"
      >
        {t("skipToContent")}
      </a>
      <AppFrame
        items={nav}
        current={{ id: membership.organization.id, name: membership.organization.name }}
        organizations={memberships.map((m) => ({ id: m.organization.id, name: m.organization.name }))}
        name={profile?.full_name ?? null}
        email={user.email ?? null}
        initialCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "collapsed"}
      >
        {children}
      </AppFrame>
    </div>
  );
}
