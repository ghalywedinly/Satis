"use client";

import { CalendarDays, KanbanSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/lib/i18n/navigation";
import { cn } from "@/lib/utils";

/** Calendar | Pipeline, in the Satis team's header. */
export function AdminTabs() {
  const t = useTranslations("admin.nav");
  const pathname = usePathname();
  const tabs = [
    { href: "/admin/bookings", label: t("calendar"), icon: CalendarDays, active: pathname === "/admin/bookings" || /^\/admin\/bookings\/[0-9a-f-]{36}/.test(pathname) },
    { href: "/admin/bookings/pipeline", label: t("pipeline"), icon: KanbanSquare, active: pathname === "/admin/bookings/pipeline" },
  ] as const;
  return (
    <nav aria-label={t("label")} className="flex gap-1">
      {tabs.map(({ href, label, icon: Icon, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex h-9 items-center gap-2 rounded-control px-3 text-sm font-semibold outline-none transition-colors duration-[140ms] focus-visible:shadow-focus",
            active ? "bg-sand text-ink" : "text-ink-200 hover:bg-ink-800 hover:text-sand",
          )}
        >
          <Icon aria-hidden strokeWidth={1.75} className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
