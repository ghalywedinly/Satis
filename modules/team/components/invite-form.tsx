"use client";

import { useActionState, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { idle } from "@/lib/forms";
import { invitableRoles } from "@/lib/permissions";
import type { OrgRole } from "@/types/database";
import { inviteMember } from "../actions";

export function InviteForm({ currentRole }: { currentRole: OrgRole }) {
  const t = useTranslations("team.invite");
  const tr = useTranslations("organization.roles");
  const td = useTranslations("organization.roleDescriptions");
  const te = useTranslations("errors");
  const locale = useLocale();
  const roleId = useId();
  const [state, action] = useActionState(inviteMember.bind(null, locale), idle);
  const roles = invitableRoles(currentRole);
  // A successful invite clears the form (new key); a failed one keeps what was typed.
  const formKey = state.status === "success" ? `sent-${state.values?.email}` : "form";

  return (
    <Card className="gap-5">
      <CardHeader>
        <CardTitle>
          <h2>{t("title")}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form key={formKey} action={action} noValidate className="flex flex-col gap-5">
          {state.status === "success" && state.values?.email && (
            <FormAlert tone="success">
              {t.rich("sent", {
                address: state.values.email,
                email: (chunks) => (
                  <bdi dir="ltr" className="font-semibold">
                    {chunks}
                  </bdi>
                ),
              })}
            </FormAlert>
          )}
          {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
          <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
            <FormField
              label={t("email")}
              name="email"
              type="email"
              dir="ltr"
              autoComplete="off"
              required
              defaultValue={state.status === "error" ? state.values?.email : undefined}
              error={state.fieldErrors?.email}
            />
            <div className="flex flex-col gap-2">
              <Label htmlFor={roleId}>{t("role")}</Label>
              <NativeSelect id={roleId} name="role" defaultValue={state.values?.role ?? "staff"}>
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {tr(role)}
                  </option>
                ))}
              </NativeSelect>
            </div>
          </div>
          <ul className="grid gap-1.5 text-sm text-muted-foreground sm:grid-cols-2">
            {roles.map((role) => (
              <li key={role}>
                <span className="font-semibold text-ink">{tr(role)}</span>
                {" — "}
                {td(role)}
              </li>
            ))}
          </ul>
          <SubmitButton size="default" className="self-start">
            {t("submit")}
          </SubmitButton>
        </form>
      </CardContent>
    </Card>
  );
}
