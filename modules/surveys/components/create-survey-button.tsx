"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { createSurvey } from "../actions";

export function CreateSurveyButton({ label }: { label?: string }) {
  const t = useTranslations("surveys");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Button disabled={pending} onClick={() => startTransition(async () => setError(await createSurvey(locale)))}>
        {pending ? <Loader2 aria-hidden strokeWidth={1.75} className="animate-spin" /> : <Plus aria-hidden strokeWidth={1.75} />}
        {label ?? t("create")}
      </Button>
      {error && <FormAlert tone="error">{te(error)}</FormAlert>}
    </div>
  );
}
