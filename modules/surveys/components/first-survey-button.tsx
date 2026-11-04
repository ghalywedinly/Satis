"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { createAndPublishFirstSurvey } from "../actions";

export function FirstSurveyButton({ label, errorMessages }: { label: string; errorMessages: Partial<Record<ErrorKey, string>> & { generic: string } }) {
  const locale = useLocale() as Locale;
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-3">
      {error && <FormAlert tone="error">{errorMessages[error] ?? errorMessages.generic}</FormAlert>}
      <Button size="lg" disabled={pending} onClick={() => startTransition(async () => setError(await createAndPublishFirstSurvey(locale)))}>
        {pending && <Loader2 aria-hidden strokeWidth={1.75} className="animate-spin" />}
        {label}
      </Button>
    </div>
  );
}
