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
export function OrgSwitcher({ current, organizations }: { current: Org; organizations: Org[] }) {
  const t = useTranslations("common.orgSwitcher");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="max-w-56 gap-1.5 px-2" disabled={pending} aria-label={`${t("label")}: ${current.name}`}>
          <span className="truncate">{current.name}</span>
          <ChevronsUpDown aria-hidden strokeWidth={1.75} className="text-muted-foreground" />
        </Button>
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
