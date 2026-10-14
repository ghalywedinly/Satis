"use client";

import { useActionState, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { idle } from "@/lib/forms";
import type { BusinessType } from "@/types/database";
import { updateOrganization } from "../actions";
import { BUSINESS_TYPES } from "../schemas";

export function OrganizationSettingsForm({
  organization,
}: {
  organization: { name: string; businessType: BusinessType; defaultLocale: "ar" | "en" };
}) {
  const t = useTranslations("settings");
  const tt = useTranslations("organization.businessTypes");
  const tl = useTranslations("common.language");
  const te = useTranslations("errors");
  const locale = useLocale();
  const typeId = useId();
  const localeId = useId();
  const localeHintId = useId();
  const [state, action] = useActionState(updateOrganization.bind(null, locale), idle);

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.status === "success" && <FormAlert tone="success">{t("saved")}</FormAlert>}
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      <FormField
        label={t("fields.name")}
        name="name"
        required
        maxLength={120}
        defaultValue={state.values?.name ?? organization.name}
        error={state.fieldErrors?.name}
      />
      <div className="flex flex-col gap-2">
        <Label htmlFor={typeId}>{t("fields.businessType")}</Label>
        <NativeSelect id={typeId} name="businessType" defaultValue={state.values?.businessType ?? organization.businessType}>
          {BUSINESS_TYPES.map((type) => (
            <option key={type} value={type}>
              {tt(type)}
            </option>
          ))}
        </NativeSelect>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={localeId}>{t("fields.defaultLocale")}</Label>
        <NativeSelect
          id={localeId}
          name="defaultLocale"
          aria-describedby={localeHintId}
          defaultValue={state.values?.defaultLocale ?? organization.defaultLocale}
        >
          <option value="ar" lang="ar">
            {tl("ar")}
          </option>
          <option value="en" lang="en">
            {tl("en")}
          </option>
        </NativeSelect>
        <p id={localeHintId} className="text-xs text-muted-foreground">
          {t("fields.defaultLocaleHint")}
        </p>
      </div>
      <SubmitButton size="default" className="self-start">
        {t("save")}
      </SubmitButton>
    </form>
  );
}
