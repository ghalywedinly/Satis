"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import { createMissingLinks } from "../actions";

export function CreateMissingLinks({ surveyId }: { surveyId: string }) {
  const t = useTranslations("surveys.share");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  return (
    <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => void (await createMissingLinks(locale, surveyId)))}>
      {t("createMissing")}
    </Button>
  );
}
