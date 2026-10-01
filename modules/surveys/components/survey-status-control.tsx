"use client";

import { useLocale, useTranslations } from "next-intl";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import { setSurveyStatus } from "../actions";

export function SurveyStatusControl({ surveyId, status }: { surveyId: string; status: "published" | "paused" }) {
  const t = useTranslations("surveys.builder");
  const locale = useLocale() as Locale;
  if (status === "paused") {
    return (
      <Button variant="outline" size="sm" onClick={() => setSurveyStatus(locale, surveyId, "published")}>
        {t("resume")}
      </Button>
    );
  }
  return (
    <ConfirmAction
      trigger={
        <Button variant="outline" size="sm">
          {t("pause")}
        </Button>
      }
      title={t("pause")}
      description={t("pauseConfirm")}
      confirmLabel={t("pause")}
      cancelLabel={t("cancel")}
      onConfirm={() => setSurveyStatus(locale, surveyId, "paused")}
    />
  );
}
