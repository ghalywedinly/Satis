"use client";

import { useTransition } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { switchOrganization } from "@/modules/organizations/actions";

type Org = { id: string; name: string };

/** Shows the current business; lets people in several businesses switch, or create another. */
export function OrgSwitcher({ current, organizations, compact = false }: { current: Org; organizations: Org[]; compact?: boolean }) {
  const t = useTranslations("common.orgSwitcher");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button variant="ghost" size="icon" className="size-11" disabled={pending} aria-label={`${t("label")}: ${current.name}`} title={current.name}>
            <span aria-hidden className="slice-sm flex size-8 items-center justify-center bg-ultramarine font-display text-sm font-bold text-white">
              {Array.from(current.name)[0]}
            </span>
          </Button>
        ) : (
          <Button variant="ghost" className="h-auto w-full justify-start gap-2.5 px-2 py-1.5" disabled={pending} aria-label={`${t("label")}: ${current.name}`}>
            <span aria-hidden className="slice-sm flex size-8 shrink-0 items-center justify-center bg-ultramarine font-display text-sm font-bold text-white">
              {Array.from(current.name)[0]}
            </span>
            <span className="flex-1 truncate text-start">{current.name}</span>
            <ChevronsUpDown aria-hidden strokeWidth={1.75} className="text-muted-foreground" />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-60">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">{t("switchTo")}</DropdownMenuLabel>
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onSelect={() => {
              if (org.id !== current.id) startTransition(() => switchOrganization(org.id));
            }}
          >
            <span className="flex-1 truncate">{org.name}</span>
            {org.id === current.id && <Check aria-hidden strokeWidth={1.75} />}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/onboarding?new=1")}>
          <Plus aria-hidden strokeWidth={1.75} />
          {t("create")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
