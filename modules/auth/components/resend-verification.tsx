"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { SubmitButton } from "@/components/forms/submit-button";
import type { FormState } from "../schemas";
import { resendVerification } from "../actions";

export function ResendVerification() {
  const t = useTranslations("auth.verify");
  const te = useTranslations("errors");
  const locale = useLocale();
  const [state, action] = useActionState(
    async (): Promise<FormState<never>> => resendVerification(locale),
    { status: "idle" },
  );

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.status === "success" && <FormAlert tone="success">{t("resent")}</FormAlert>}
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      <SubmitButton variant="outline">{t("resend")}</SubmitButton>
    </form>
  );
}
