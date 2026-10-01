"use client";

import { LogOut, UserRound } from "lucide-react";
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
import { resetClientIdentity } from "@/lib/observability/client";
import { logOut } from "@/modules/auth/actions";

export function UserMenu({ name, email }: { name: string | null; email: string | null }) {
  const t = useTranslations("common");
  const locale = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={name ?? email ?? t("actions.logOut")}>
          <UserRound aria-hidden strokeWidth={1.75} className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          {name && <span className="font-semibold">{name}</span>}
          {email && (
            <bdi dir="ltr" className="text-xs font-normal text-muted-foreground">
              {email}
            </bdi>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
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
