"use client";

import { ClipboardList, LayoutDashboard, MapPin, MessageSquareText, Settings, TicketPercent, UsersRound, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: "/dashboard" | "/inbox" | "/surveys" | "/coupons" | "/locations" | "/team" | "/settings";
  label: "dashboard" | "inbox" | "surveys" | "coupons" | "locations" | "team" | "settings";
  /** Pre-formatted count shown next to the label (e.g. unread feedback). */
  badge?: string;
};

const ICONS: Record<NavItem["label"], LucideIcon> = {
  dashboard: LayoutDashboard,
  inbox: MessageSquareText,
  surveys: ClipboardList,
  coupons: TicketPercent,
  locations: MapPin,
  team: UsersRound,
  settings: Settings,
};

/**
 * Primary navigation. Vertical in the desktop sidebar (icons only when collapsed);
 * a horizontally scrolling row on small screens instead of hiding items.
 */
export function MainNav({ items, orientation = "horizontal", collapsed = false }: { items: NavItem[]; orientation?: "horizontal" | "vertical"; collapsed?: boolean }) {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  const vertical = orientation === "vertical";
  return (
    <nav aria-label={t("mainNavigation")} className={cn("flex gap-1", vertical ? "flex-col" : "-mx-1 overflow-x-auto px-1 pb-0.5")}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = ICONS[item.label];
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            title={collapsed ? t(item.label) : undefined}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2.5 rounded-control text-sm font-semibold whitespace-nowrap outline-none transition-colors duration-[140ms] ease-[var(--ease-standard)] focus-visible:shadow-focus",
              vertical ? (collapsed ? "size-11 justify-center" : "h-11 px-3") : "h-9 px-3",
              active ? "bg-ink text-sand" : "text-ink-600 hover:bg-white/80 hover:text-ink",
            )}
          >
            <Icon aria-hidden strokeWidth={1.75} className={cn("size-5 shrink-0", !vertical && "size-4")} />
            <span className={cn(collapsed && "sr-only", vertical && !collapsed && "flex-1")}>{t(item.label)}</span>
            {item.badge && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-xs leading-none font-semibold tabular",
                  active ? "bg-white text-ink" : "bg-ultramarine text-white",
                  collapsed && "absolute -top-1.5 -end-1.5 min-w-5 text-center ring-2 ring-white",
                )}
              >
                {item.badge}
                <span className="sr-only"> {t("unreadBadge")}</span>
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
