"use client";

import { useState, useTransition } from "react";
import { Copy, Loader2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { copyPreToPost } from "../actions";

/** Gives the after-survey the before-survey's questions, so every question is compared. */
export function CopyQuestionsButton({ studyId }: { studyId: string }) {
  const t = useTranslations("studies.surveys");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [result, setResult] = useState<ErrorKey | "done" | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => startTransition(async () => setResult((await copyPreToPost(locale, studyId)) ?? "done"))}
        className="self-start"
      >
        {pending ? <Loader2 aria-hidden strokeWidth={1.75} className="animate-spin" /> : <Copy aria-hidden strokeWidth={1.75} />}
        {t("copy")}
      </Button>
      {result === "done" ? <FormAlert tone="success">{t("copied")}</FormAlert> : result && <FormAlert tone="error">{te(result)}</FormAlert>}
    </div>
  );
}
