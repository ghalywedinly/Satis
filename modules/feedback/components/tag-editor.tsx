"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { addTag, removeTag } from "../actions";
import { TagChip } from "./badges";

type Tag = { id: string; name: string };

/** The response's tags, with a field to add one: pick an existing tag or type a new name. */
export function TagEditor({ responseId, tags, allTags, canEdit }: { responseId: string; tags: Tag[]; allTags: Tag[]; canEdit: boolean }) {
  const t = useTranslations("inbox.detail");
  const tErrors = useTranslations("errors");
  const locale = useLocale() as Locale;
  const listId = useId();
  const [name, setName] = useState("");
  const [error, setError] = useState<ErrorKey | null>(null);
  const [pending, startTransition] = useTransition();
  const [shown, removeOptimistic] = useOptimistic(tags, (current, tagId: string) => current.filter((tag) => tag.id !== tagId));
  const suggestions = allTags.filter((tag) => !shown.some((s) => s.id === tag.id));

  const add = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = name.trim();
    if (!value) return;
    startTransition(async () => {
      const result = await addTag(locale, responseId, value);
      setError(result);
      if (!result) setName("");
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noTags")}</p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {shown.map((tag) => (
            <li key={tag.id}>
              <TagChip name={tag.name}>
                {canEdit && (
                  <button
                    type="button"
                    aria-label={t("removeTag", { tag: tag.name })}
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        removeOptimistic(tag.id);
                        setError(await removeTag(locale, responseId, tag.id));
                      })
                    }
                    className="-me-1 cursor-pointer rounded-full p-0.5 text-muted-foreground outline-none hover:bg-sand-100 hover:text-ink focus-visible:shadow-focus"
                  >
                    <X aria-hidden strokeWidth={1.75} className="size-3" />
                  </button>
                )}
              </TagChip>
            </li>
          ))}
        </ul>
      )}
      {canEdit && (
        <form onSubmit={add} className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            list={listId}
            maxLength={40}
            aria-label={t("tagName")}
            placeholder={t("tagPlaceholder")}
            aria-invalid={error ? true : undefined}
          />
          <datalist id={listId}>
            {suggestions.map((tag) => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>
          <Button type="submit" variant="outline" disabled={pending || !name.trim()}>
            <Plus aria-hidden strokeWidth={1.75} />
            {t("addTag")}
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {tErrors(error)}
        </p>
      )}
    </div>
  );
}
