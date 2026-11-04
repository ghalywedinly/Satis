"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Link } from "@/lib/i18n/navigation";
import { logIn } from "../actions";

export function LoginForm({ next }: { next?: string }) {
  const t = useTranslations("auth");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [state, action] = useActionState(logIn.bind(null, locale), { status: "idle" });

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      {next && <input type="hidden" name="next" value={next} />}
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
      <div className="flex flex-col gap-2">
        <FormField
          label={t("fields.password")}
          name="password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          required
          error={state.fieldErrors?.password}
        />
        <Link href="/forgot-password" className="self-start text-sm font-medium text-ultramarine hover:underline">
          {t("login.forgotPassword")}
        </Link>
      </div>
      <SubmitButton>{t("login.submit")}</SubmitButton>
    </form>
  );
}
