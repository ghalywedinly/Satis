"use client";

import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: "/dashboard" | "/inbox" | "/surveys" | "/locations" | "/team" | "/settings";
  label: "dashboard" | "inbox" | "surveys" | "locations" | "team" | "settings";
  /** Pre-formatted count shown next to the label (e.g. unread feedback). */
  badge?: string;
};

/** Primary navigation. Scrolls horizontally on small screens instead of hiding. */
export function MainNav({ items }: { items: NavItem[] }) {
  const t = useTranslations("common.nav");
  const pathname = usePathname();
  return (
    <nav aria-label={t("mainNavigation")} className="-mx-1 flex gap-1 overflow-x-auto">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-control px-3 py-2 text-sm font-semibold whitespace-nowrap outline-none transition-colors duration-[140ms] focus-visible:shadow-focus",
              active ? "bg-sand-100 text-ink" : "text-muted-foreground hover:bg-sand-100 hover:text-ink",
            )}
          >
            {t(item.label)}
            {item.badge && (
              <span className="rounded-full bg-ultramarine px-1.5 py-0.5 text-xs leading-none font-semibold text-white tabular">
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
