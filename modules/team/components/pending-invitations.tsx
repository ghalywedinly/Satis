"use client";

import { X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/i18n/format";
import type { OrgRole } from "@/types/database";
import { revokeInvitation } from "../actions";

export type PendingInvitation = { id: string; email: string; role: OrgRole; expiresAt: string };

export function PendingInvitations({ invitations }: { invitations: PendingInvitation[] }) {
  const t = useTranslations("team");
  const tr = useTranslations("organization.roles");
  const locale = useLocale();

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xl font-bold">{t("pending.title")}</h2>
      <ul className="flex flex-col divide-y divide-ink-100 rounded-card border glass">
        {invitations.map((invitation) => (
          <li key={invitation.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <bdi dir="ltr" className="truncate font-semibold">
                {invitation.email}
              </bdi>
              <span className="text-sm text-muted-foreground">
                {tr(invitation.role)} · {t("pending.expires", { date: formatDate(locale, invitation.expiresAt) })}
              </span>
            </div>
            <ConfirmAction
              trigger={
                <Button variant="ghost" size="icon-sm" aria-label={t("pending.revokeNamed", { email: invitation.email })}>
                  <X aria-hidden strokeWidth={1.75} />
                </Button>
              }
              title={t("pending.revoke")}
              description={t("pending.revokeNamed", { email: invitation.email })}
              confirmLabel={t("pending.revoke")}
              cancelLabel={t("cancel")}
              destructive
              onConfirm={() => revokeInvitation(locale, invitation.id)}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
