"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { updatePassword } from "../actions";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [state, action] = useActionState(updatePassword.bind(null, locale), { status: "idle" });

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      <FormField
        label={t("fields.newPassword")}
        name="password"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        required
        hint={t("fields.passwordHint")}
        error={state.fieldErrors?.password}
      />
      <FormField
        label={t("fields.confirmPassword")}
        name="confirmPassword"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton>{t("reset.submit")}</SubmitButton>
    </form>
  );
}
