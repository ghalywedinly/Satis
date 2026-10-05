"use client";

import { useState } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { SatisLogo, SatisMark } from "@/components/brand/satis-mark";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";
import { MainNav, type NavItem } from "./main-nav";
import { OrgSwitcher } from "./org-switcher";
import { SIDEBAR_COOKIE } from "./sidebar-cookie";
import { UserMenu } from "./user-menu";


type Org = { id: string; name: string };

/**
 * The signed-in frame: a floating glass sidebar on large screens that collapses to icons,
 * and a floating glass bar with a scrolling menu on small screens.
 */
export function AppFrame({
  items,
  current,
  organizations,
  name,
  email,
  initialCollapsed,
  children,
}: {
  items: NavItem[];
  current: Org;
  organizations: Org[];
  name: string | null;
  email: string | null;
  initialCollapsed: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("common");
  const locale = useLocale() as "ar" | "en";
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next ? "collapsed" : "expanded"}; path=/; max-age=31536000; samesite=lax`;
  };
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <>
      <aside
        className={cn(
          "glass fixed inset-y-3 start-3 z-30 hidden flex-col gap-4 overflow-hidden rounded-dialog border p-3 shadow-lg transition-[width] duration-[320ms] ease-[var(--ease-standard)] lg:flex print:hidden",
          collapsed ? "w-[76px] items-center" : "w-64",
        )}
      >
        <div className={cn("flex items-center pt-1", collapsed ? "justify-center" : "justify-between ps-2")}>
          <Link href="/dashboard" aria-label={t("appName")} className="rounded-control p-1 outline-none focus-visible:shadow-focus">
            {collapsed ? <SatisMark tone="ink-ultra" className="h-7" /> : <SatisLogo tone="ink-ultra" locale={locale} size={26} />}
          </Link>
        </div>

        <OrgSwitcher current={current} organizations={organizations} compact={collapsed} />

        <div className={cn("h-px bg-ink-100", collapsed ? "w-8" : "mx-2")} />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <MainNav items={items} orientation="vertical" collapsed={collapsed} />
        </div>

        {/* Brand speed lines: a quiet signature above the account controls. */}
        {!collapsed && (
          <div aria-hidden className="flex flex-col gap-1 px-2">
            <span className="slice-sm h-1.5 w-2/3 bg-ink-200" />
            <span className="slice-sm h-1.5 w-1/2 bg-ink-200" />
            <span className="slice-sm h-1.5 w-1/3 bg-ultramarine" />
          </div>
        )}

        <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "items-center")}>
          <UserMenu name={name} email={email} expanded={!collapsed} side="top" />
          <LanguageSwitcher persist iconOnly />
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
          title={collapsed ? t("nav.expand") : t("nav.collapse")}
          className={cn("text-ink-600", collapsed ? "size-11 px-0" : "w-full justify-start")}
        >
          <ToggleIcon aria-hidden strokeWidth={1.75} className="size-5 rtl:-scale-x-100" />
          {!collapsed && t("nav.collapse")}
        </Button>
      </aside>

      <header className="glass sticky top-3 z-30 mx-3 mt-3 flex flex-col gap-2 rounded-card border p-2.5 shadow-md lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link href="/dashboard" aria-label={t("appName")} className="shrink-0 rounded-control p-1 outline-none focus-visible:shadow-focus">
              <SatisMark tone="ink-ultra" className="h-6" />
            </Link>
            <div className="min-w-0 max-w-56">
              <OrgSwitcher current={current} organizations={organizations} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher persist />
            <UserMenu name={name} email={email} />
          </div>
        </div>
        <MainNav items={items} />
      </header>

      <main
        id="content"
        className={cn(
          "w-full flex-1 px-4 py-6 transition-[padding] duration-[320ms] ease-[var(--ease-standard)] sm:px-6 sm:py-8 print:p-0",
          collapsed ? "lg:ps-[112px]" : "lg:ps-[292px]",
          "lg:pe-8",
        )}
      >
        <div className="mx-auto w-full max-w-6xl">{children}</div>
      </main>
    </>
  );
}
