"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { requestPasswordReset } from "../actions";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [state, action] = useActionState(requestPasswordReset.bind(null, locale), { status: "idle" });

  if (state.status === "success") return <FormAlert tone="success">{t("forgot.sent")}</FormAlert>;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      <FormField
        label={t("fields.email")}
        name="email"
        type="email"
        dir="ltr"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <SubmitButton>{t("forgot.submit")}</SubmitButton>
    </form>
  );
}
