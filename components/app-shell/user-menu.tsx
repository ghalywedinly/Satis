"use client";

import { BellRing, LogOut, UserRound } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/lib/i18n/navigation";
import { resetClientIdentity } from "@/lib/observability/client";
import { cn } from "@/lib/utils";
import { logOut } from "@/modules/auth/actions";

export function UserMenu({ name, email, expanded = false, side, onInk = false }: { name: string | null; email: string | null; expanded?: boolean; side?: "top" | "bottom"; onInk?: boolean }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {expanded ? (
          <Button variant="ghost" className={cn("h-auto min-w-0 flex-1 justify-start gap-2.5 px-2 py-1.5", onInk && "text-white hover:bg-ink-800 hover:text-white")} aria-label={name ?? email ?? t("actions.logOut")}>
            <span aria-hidden className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", onInk ? "bg-zest text-ink" : "bg-ink text-white")}>
              <UserRound strokeWidth={1.75} className="size-4" />
            </span>
            <span className="flex min-w-0 flex-col items-start">
              {name && <span className="max-w-full truncate">{name}</span>}
              {email && (
                <bdi dir="ltr" className={cn("max-w-full truncate text-xs font-normal", onInk ? "text-ink-300" : "text-muted-foreground")}>
                  {email}
                </bdi>
              )}
            </span>
          </Button>
        ) : (
          <Button variant="ghost" size="icon" className={cn(onInk && "text-ink-200 hover:bg-ink-800 hover:text-white")} aria-label={name ?? email ?? t("actions.logOut")}>
            <UserRound aria-hidden strokeWidth={1.75} className="size-5" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side={side} className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          {name && <span className="font-semibold">{name}</span>}
          {email && (
            <bdi dir="ltr" className="text-xs font-normal text-muted-foreground">
              {email}
            </bdi>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/notifications")}>
          <BellRing aria-hidden strokeWidth={1.75} />
          {t("nav.notifications")}
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            resetClientIdentity();
            void logOut(locale);
          }}
        >
          <LogOut aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
          {t("actions.logOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
