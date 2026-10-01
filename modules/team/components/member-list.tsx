"use client";

import { useState, useTransition } from "react";
import { UserMinus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { ErrorKey } from "@/lib/forms";
import { assignableRoles, canManageMember } from "@/lib/permissions";
import type { OrgRole } from "@/types/database";
import { changeMemberRole, leaveOrganization, removeMember } from "../actions";

export type Member = { memberId: string; userId: string; role: OrgRole; fullName: string | null; email: string };

export function MemberList({ members, currentUserId, currentRole }: { members: Member[]; currentUserId: string; currentRole: OrgRole }) {
  const t = useTranslations("team");
  const tr = useTranslations("organization.roles");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3">
      {error && <FormAlert tone="error">{te(error)}</FormAlert>}
      <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-white">
        {members.map((member) => {
          const self = member.userId === currentUserId;
          const name = member.fullName || member.email;
          const manageable = !self && canManageMember(currentRole, member.role);
          return (
            <li key={member.memberId} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-semibold">
                  {name}
                  {self && <span className="ms-2 text-sm font-medium text-muted-foreground">{t("you")}</span>}
                </span>
                {member.fullName && (
                  <bdi dir="ltr" className="truncate text-sm text-muted-foreground">
                    {member.email}
                  </bdi>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {manageable ? (
                  <NativeSelect
                    aria-label={t("roleFor", { name })}
                    value={member.role}
                    disabled={pending}
                    className="h-9 w-36"
                    onChange={(e) => {
                      const role = e.target.value;
                      setError(null);
                      startTransition(async () => setError(await changeMemberRole(locale, member.memberId, role)));
                    }}
                  >
                    {assignableRoles(currentRole).map((role) => (
                      <option key={role} value={role}>
                        {tr(role)}
                      </option>
                    ))}
                  </NativeSelect>
                ) : (
                  <span className="rounded-control bg-sand-100 px-3 py-1.5 text-sm font-medium">{tr(member.role)}</span>
                )}
                {manageable && (
                  <ConfirmAction
                    trigger={
                      <Button variant="ghost" size="icon-sm" aria-label={t("removeNamed", { name })}>
                        <UserMinus aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
                      </Button>
                    }
                    title={t("removeNamed", { name })}
                    description={t("removeConfirm", { name })}
                    confirmLabel={t("remove")}
                    cancelLabel={t("cancel")}
                    destructive
                    onConfirm={() => removeMember(locale, member.memberId)}
                  />
                )}
                {self && (
                  <ConfirmAction
                    trigger={
                      <Button variant="ghost" size="sm">
                        {t("leave")}
                      </Button>
                    }
                    title={t("leave")}
                    description={t("leaveConfirm")}
                    confirmLabel={t("leave")}
                    cancelLabel={t("cancel")}
                    destructive
                    onConfirm={() => leaveOrganization(locale)}
                  />
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
