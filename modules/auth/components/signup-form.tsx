"use client";

import { useActionState, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { trackClient } from "@/lib/observability/client";
import { signUp } from "../actions";

export function SignupForm() {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [state, action] = useActionState(signUp.bind(null, locale), { status: "idle" });
  useEffect(() => trackClient("signup_started"), []);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      <FormField
        label={t("fields.fullName")}
        name="fullName"
        autoComplete="name"
        required
        maxLength={120}
        defaultValue={state.values?.fullName}
        error={state.fieldErrors?.fullName}
      />
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
      <FormField
        label={t("fields.password")}
        name="password"
        type="password"
        dir="ltr"
        autoComplete="new-password"
        required
        hint={t("fields.passwordHint")}
        error={state.fieldErrors?.password}
      />
      <SubmitButton>{t("signup.submit")}</SubmitButton>
    </form>
  );
}
