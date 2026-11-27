"use client";

import { useId, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/lib/i18n/routing";
import { saveReviewReply } from "../actions";

/** In the inbox, for a review the customer published: write, change or delete the public reply. */
export function PublicReplyForm({ responseId, reply, canEdit }: { responseId: string; reply: string | null; canEdit: boolean }) {
  const t = useTranslations("score.reply");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const id = useId();
  const [text, setText] = useState(reply ?? "");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const save = (value: string) =>
    startTransition(async () => {
      const result = await saveReviewReply(locale, { responseId, reply: value });
      if ("ok" in result) setMessage({ tone: "success", text: value ? t("saved") : t("removed") });
      else setMessage({ tone: "error", text: te(result.error) });
    });

  if (!canEdit) {
    return reply ? (
      <p dir="auto" className="text-start text-sm whitespace-pre-line">
        {reply}
      </p>
    ) : null;
  }

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        save(text.trim());
      }}
    >
      {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
      <label htmlFor={id} className="text-sm font-semibold">
        {t("label")}
      </label>
      <textarea
        id={id}
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={1000}
        dir="auto"
        className="rounded-control border border-input bg-white px-3 py-2 text-base outline-none focus-visible:border-ultramarine focus-visible:shadow-focus"
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !text.trim() || text.trim() === (reply ?? "")}>
          {reply ? t("update") : t("save")}
        </Button>
        {reply && (
          <Button
            type="button"
            variant="ghost"
            disabled={pending}
            onClick={() => {
              setText("");
              save("");
            }}
          >
            {t("remove")}
          </Button>
        )}
      </div>
    </form>
  );
}
