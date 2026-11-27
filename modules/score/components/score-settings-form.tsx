"use client";

import { useActionState, useId } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { FormField } from "@/components/forms/form-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { Label } from "@/components/ui/label";
import { idle } from "@/lib/forms";
import { updateScoreSettings } from "../actions";

/** A labelled on/off switch built on a checkbox, so it posts with the form. */
function Switch({ name, label, hint, defaultChecked }: { name: string; label: string; hint: string; defaultChecked: boolean }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-6 border-b border-ink-100 py-4 first:pt-0">
      <div className="flex flex-col gap-1">
        <label htmlFor={id} className="font-semibold">
          {label}
        </label>
        <p id={`${id}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      </div>
      <span className="relative inline-flex shrink-0">
        <input
          id={id}
          name={name}
          type="checkbox"
          role="switch"
          aria-describedby={`${id}-hint`}
          defaultChecked={defaultChecked}
          className="peer h-7 w-12 cursor-pointer appearance-none rounded-full bg-ink-200 outline-none transition-colors duration-[140ms] checked:bg-mint focus-visible:shadow-focus"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute start-1 top-1 size-5 rounded-full bg-white transition-transform duration-[140ms] ease-[var(--ease-standard)] peer-checked:translate-x-5 rtl:peer-checked:-translate-x-5"
        />
      </span>
    </div>
  );
}

export function ScoreSettingsForm({
  page,
  origin,
}: {
  page: { enabled: boolean; reviewsEnabled: boolean; slug: string; about: string; website: string };
  origin: string;
}) {
  const t = useTranslations("score.settings.page");
  const te = useTranslations("errors");
  const locale = useLocale();
  const aboutId = useId();
  const [state, action] = useActionState(updateScoreSettings.bind(null, locale), idle);
  const values = state.values;

  return (
    <form action={action} noValidate className="flex flex-col gap-5">
      {state.status === "success" && <FormAlert tone="success">{t("saved")}</FormAlert>}
      {state.formError && <FormAlert tone="error">{te(state.formError)}</FormAlert>}
      <div className="flex flex-col">
        <Switch name="enabled" label={t("enabled")} hint={t("enabledHint")} defaultChecked={page.enabled} />
        <Switch name="reviewsEnabled" label={t("reviews")} hint={t("reviewsHint")} defaultChecked={page.reviewsEnabled} />
      </div>
      <div className="flex flex-col gap-2">
        <FormField
          label={t("slug")}
          name="slug"
          dir="ltr"
          maxLength={40}
          autoCapitalize="none"
          spellCheck={false}
          defaultValue={values?.slug ?? page.slug}
          hint={t("slugHint")}
          error={state.fieldErrors?.slug}
        />
        <p className="text-xs text-ink-500">
          <bdi dir="ltr">{`${origin.replace(/^https?:\/\//, "")}/score/`}</bdi>
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor={aboutId}>{t("about")}</Label>
        <textarea
          id={aboutId}
          name="about"
          rows={3}
          maxLength={280}
          dir="auto"
          aria-describedby={`${aboutId}-hint`}
          defaultValue={values?.about ?? page.about}
          className="rounded-control border border-input bg-white px-3 py-2 text-base outline-none focus-visible:border-ultramarine focus-visible:shadow-focus"
        />
        <p id={`${aboutId}-hint`} className="text-xs text-muted-foreground">
          {t("aboutHint")}
        </p>
      </div>
      <FormField
        label={t("website")}
        name="website"
        dir="ltr"
        maxLength={140}
        inputMode="url"
        autoCapitalize="none"
        spellCheck={false}
        defaultValue={values?.website ?? page.website}
        hint={t("websiteHint")}
        error={state.fieldErrors?.website}
      />
      <SubmitButton size="default" className="self-start">
        {t("save")}
      </SubmitButton>
    </form>
  );
}
