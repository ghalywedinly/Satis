"use client";

import { useActionState, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Label } from "@/components/ui/label";
import { idle, type FormState } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { createStudy, updateStudy } from "../actions";
import type { StudyField } from "../schemas";

type Props =
  | { mode: "create" }
  | { mode: "edit"; studyId: string; initial: { name: string; description: string; matchParticipants: boolean } };

/** Name, description and participant matching; when creating, also the starting questions. */
export function StudyForm(props: Props) {
  const t = useTranslations("studies");
  const tv = useTranslations("validation");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const action = props.mode === "create" ? createStudy.bind(null, locale) : updateStudy.bind(null, locale, props.studyId);
  const [state, formAction] = useActionState<FormState<StudyField>, FormData>(action, idle);
  const initial = props.mode === "edit" ? props.initial : { name: "", description: "", matchParticipants: true };
  const descriptionId = useId();

  return (
    <form action={formAction} noValidate className="flex flex-col gap-6">
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      {state.status === "success" && <FormAlert tone="success">{t("details.saved")}</FormAlert>}

      <FormField
        label={t("new.name")}
        name="name"
        required
        maxLength={120}
        placeholder={t("new.namePlaceholder")}
        defaultValue={state.values?.name ?? initial.name}
        error={state.fieldErrors?.name}
        className="h-11"
      />

      <div className="flex flex-col gap-2">
        <Label htmlFor={descriptionId}>{t("new.description")}</Label>
        <textarea
          id={descriptionId}
          name="description"
          rows={3}
          maxLength={1000}
          defaultValue={state.values?.description ?? initial.description}
          aria-invalid={state.fieldErrors?.description ? true : undefined}
          aria-describedby={`${descriptionId}-hint`}
          className="w-full resize-y rounded-control border border-input bg-white px-3 py-2.5 text-base outline-none transition-[border-color,box-shadow] duration-[140ms] focus-visible:border-ultramarine focus-visible:shadow-focus md:text-sm"
        />
        <p id={`${descriptionId}-hint`} className={cn("text-xs", state.fieldErrors?.description ? "font-medium text-ember-700" : "text-muted-foreground")}>
          {state.fieldErrors?.description ? tv(state.fieldErrors.description) : t("new.descriptionHint")}
        </p>
      </div>

      {props.mode === "create" && (
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-sm font-medium">{t("new.template")}</legend>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {(["research", "satisfaction"] as const).map((template, i) => (
              <label
                key={template}
                className="flex cursor-pointer flex-col gap-1 rounded-tile border border-border bg-white/70 p-4 transition-colors duration-[140ms] hover:bg-white has-checked:border-ink has-checked:bg-white has-checked:ring-1 has-checked:ring-ink has-focus-visible:shadow-focus"
              >
                <input type="radio" name="template" value={template} defaultChecked={i === 0} className="sr-only" />
                <span className="font-semibold">{t(`new.templates.${template}.title`)}</span>
                <span className="text-sm text-muted-foreground">{t(`new.templates.${template}.body`)}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="flex cursor-pointer items-start gap-4 rounded-tile border border-border bg-white/70 p-4 transition-colors duration-[140ms] hover:bg-white">
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="font-semibold">{t("new.match")}</span>
          <span className="text-sm text-muted-foreground">{t("new.matchHint")}</span>
        </span>
        <input type="checkbox" role="switch" name="matchParticipants" defaultChecked={initial.matchParticipants} className="peer sr-only" />
        <span
          aria-hidden
          className="relative mt-1 h-6 w-11 shrink-0 rounded-full bg-ink-200 transition-colors duration-[140ms] peer-checked:bg-ultramarine peer-focus-visible:shadow-focus after:absolute after:top-0.5 after:start-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform after:duration-[140ms] peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5"
        />
      </label>

      <SubmitButton className="self-start">{props.mode === "create" ? t("new.submit") : t("details.save")}</SubmitButton>
    </form>
  );
}
