"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { ErrorKey } from "@/lib/forms";
import { formatCount } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { analyzeNow } from "../actions";

export function AnalyzeNowButton() {
  const t = useTranslations("ai.insights");
  const tErrors = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error: ErrorKey } | { analysed: number } | null>(null);
  return (
    <div className="flex flex-col items-start gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setMessage(await analyzeNow(locale));
          })
        }
      >
        {pending ? <Loader2 aria-hidden strokeWidth={1.75} className="animate-spin" /> : <Sparkles aria-hidden strokeWidth={1.75} />}
        {pending ? t("analyzing") : t("analyzeNow")}
      </Button>
      <p aria-live="polite" className="text-sm">
        {message && "error" in message && <span className="text-ember-700">{tErrors(message.error)}</span>}
        {message && "analysed" in message && <span className="text-mint-700">{t("done", { count: formatCount(locale, message.analysed) })}</span>}
      </p>
    </div>
  );
}
