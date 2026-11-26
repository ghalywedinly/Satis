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
 * The signed-in frame: an Ink sidebar on large screens that collapses to icons,
 * and a white top bar with a scrolling menu on small screens.
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
          "fixed inset-y-0 start-0 z-30 hidden flex-col gap-3 overflow-hidden bg-ink p-3 text-white transition-[width] duration-[200ms] ease-[var(--ease-standard)] lg:flex print:hidden",
          collapsed ? "w-[76px] items-center" : "w-60",
        )}
      >
        <div className={cn("flex items-center pt-2 pb-1", collapsed ? "justify-center" : "justify-between ps-2")}>
          <Link href="/dashboard" aria-label={t("appName")} className="rounded-control p-1 outline-none focus-visible:shadow-focus">
            {collapsed ? <SatisMark tone="zest" className="h-7" /> : <SatisLogo tone="zest" locale={locale} size={24} />}
          </Link>
        </div>

        <OrgSwitcher current={current} organizations={organizations} compact={collapsed} onInk />

        <div className="min-h-0 flex-1 overflow-y-auto">
          <MainNav items={items} orientation="vertical" collapsed={collapsed} />
        </div>

        <div className={cn("flex gap-1", collapsed ? "flex-col items-center" : "items-center")}>
          <UserMenu name={name} email={email} expanded={!collapsed} side="top" onInk />
          <LanguageSwitcher persist iconOnly className="text-ink-200 hover:bg-ink-800 hover:text-white" />
        </div>

        <Button
          type="button"
          variant="ghost"
          onClick={toggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? t("nav.expand") : t("nav.collapse")}
          title={collapsed ? t("nav.expand") : t("nav.collapse")}
          className={cn("text-ink-300 hover:bg-ink-800 hover:text-white", collapsed ? "size-11 px-0" : "w-full justify-start")}
        >
          <ToggleIcon aria-hidden strokeWidth={1.75} className="size-5 rtl:-scale-x-100" />
          {!collapsed && t("nav.collapse")}
        </Button>
      </aside>

      <header className="sticky top-0 z-30 flex flex-col gap-2 border-b border-ink-100 bg-white px-3 py-2.5 lg:hidden print:hidden">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <Link href="/dashboard" aria-label={t("appName")} className="shrink-0 rounded-control p-1 outline-none focus-visible:shadow-focus">
              <SatisMark tone="ink" className="h-6" />
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
          collapsed ? "lg:ps-[108px]" : "lg:ps-[272px]",
          "lg:pe-8",
        )}
      >
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </>
  );
}
