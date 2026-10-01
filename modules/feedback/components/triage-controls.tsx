"use client";

import { useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { MailOpen, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import type { ResponseStatus } from "@/types/database";
import { updateResponse, type TriageChange } from "../actions";
import { STATUSES } from "../filters";

type State = { status: ResponseStatus; isImportant: boolean };

/** Status and the important flag. Changes show instantly; the server confirms or reverts them. */
export function TriageControls({ responseId, status, isImportant }: { responseId: string; status: ResponseStatus; isImportant: boolean }) {
  const t = useTranslations("inbox");
  const tErrors = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<ErrorKey | null>(null);
  const [state, setOptimistic] = useOptimistic<State, Partial<State>>({ status, isImportant }, (current, change) => ({ ...current, ...change }));

  const save = (optimistic: Partial<State>, change: TriageChange) =>
    startTransition(async () => {
      setOptimistic(optimistic);
      setError(await updateResponse(locale, responseId, change));
    });

  return (
    <div className="flex flex-col gap-4">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t("detail.statusLabel")}
        <NativeSelect value={state.status} disabled={pending} onChange={(e) => save({ status: e.target.value as ResponseStatus }, { status: e.target.value as ResponseStatus })}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </NativeSelect>
      </label>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          aria-pressed={state.isImportant}
          disabled={pending}
          onClick={() => save({ isImportant: !state.isImportant }, { is_important: !state.isImportant })}
        >
          <Star aria-hidden strokeWidth={1.75} className={state.isImportant ? "fill-ember-500 text-ember-500" : undefined} />
          {state.isImportant ? t("unmarkImportant") : t("markImportant")}
        </Button>
        <MarkUnreadButton responseId={responseId} />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {tErrors(error)}
        </p>
      )}
    </div>
  );
}

function MarkUnreadButton({ responseId }: { responseId: string }) {
  const t = useTranslations("inbox");
  const locale = useLocale() as Locale;
  const [pending, startTransition] = useTransition();
  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await updateResponse(locale, responseId, { is_read: false });
        })
      }
    >
      <MailOpen aria-hidden strokeWidth={1.75} />
      {t("markUnread")}
    </Button>
  );
}

/** Marks the response read once it's been opened by someone who can triage. */
export function MarkRead({ responseId }: { responseId: string }) {
  const locale = useLocale() as Locale;
  const done = useRef(false);
  useEffect(() => {
    if (done.current) return;
    done.current = true;
    void updateResponse(locale, responseId, { is_read: true });
  }, [locale, responseId]);
  return null;
}
