"use client";

import { useId, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { SatisSeal } from "@/components/brand/seal";
import { publishReview } from "@/modules/score/public-actions";

/**
 * On the thank-you screen: asks the customer whether to publish their comment on Satis Score,
 * under the first name they type (or none). Nothing is published unless they press the button.
 */
export function PublishConsent({
  submissionId,
  labels,
}: {
  submissionId: string;
  labels: { title: string; body: string; name: string; button: string; done: string; error: string };
}) {
  const nameId = useId();
  const [name, setName] = useState("");
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [pending, startTransition] = useTransition();

  if (state === "done") {
    return (
      <p role="status" className="flex items-center gap-2 rounded-control bg-mint px-4 py-3 text-sm font-semibold text-ink">
        <Check aria-hidden strokeWidth={2.5} className="size-4 shrink-0" />
        {labels.done}
      </p>
    );
  }

  return (
    <form
      className="flex w-full flex-col gap-3 rounded-card bg-white p-5 text-start text-ink"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await publishReview({ submissionId, name });
          setState(result.ok ? "done" : "error");
        });
      }}
    >
      <div className="flex items-start gap-3">
        <SatisSeal className="size-10" />
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-base font-bold">{labels.title}</h2>
          <p className="text-sm leading-relaxed text-ink-500">{labels.body}</p>
        </div>
      </div>
      <label htmlFor={nameId} className="text-sm font-semibold">
        {labels.name}
      </label>
      <input
        id={nameId}
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={40}
        autoComplete="given-name"
        className="h-11 rounded-control border border-ink-200 bg-white px-3 text-base outline-none focus-visible:border-ultramarine focus-visible:shadow-focus"
      />
      {state === "error" && (
        <p role="alert" className="text-sm text-ember-700">
          {labels.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="flex h-11 items-center justify-center gap-2 rounded-control bg-ultramarine px-4 text-[15px] font-semibold text-white outline-none transition-colors duration-[140ms] hover:bg-ultra-600 focus-visible:shadow-focus active:translate-y-px disabled:opacity-60"
      >
        {pending && <Loader2 aria-hidden strokeWidth={1.75} className="size-4 animate-spin" />}
        {labels.button}
      </button>
    </form>
  );
}
