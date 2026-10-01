"use client";

import { useRef, useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { SatisLogo, SatisMark } from "@/components/brand/satis-mark";
import { RatingSlices } from "@/components/brand/slice";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import type { Messages } from "@/locales";
import { textIn, unansweredRequired, type Answers, type Question, type SurveyDefinition } from "../definition";
import { submitSurveyResponse, type SubmitResult } from "../public-actions";

export type SurveyLabels = Messages["publicSurvey"];

type Mode = { kind: "live"; code: string; versionId: string } | { kind: "preview" };

/**
 * The customer-facing survey (spec §14): mobile-first, one screen, no account.
 * Also used as the live preview in the builder (`mode.kind === "preview"`), where nothing is saved.
 * Text comes in through `labels` so the public page doesn't need the full translation system.
 */
export function SurveyForm({
  definition,
  locale,
  organizationName,
  locationName,
  labels,
  mode,
  otherLanguageHref,
}: {
  definition: SurveyDefinition;
  locale: Locale;
  organizationName: string;
  locationName?: string;
  labels: SurveyLabels;
  mode: Mode;
  otherLanguageHref?: string;
}) {
  const [answers, setAnswers] = useState<Answers>({});
  const [missing, setMissing] = useState<string[]>([]);
  const [error, setError] = useState<Exclude<SubmitResult, { ok: true }>["error"] | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const [submissionId] = useState(() => crypto.randomUUID());
  const honeypot = useRef<HTMLInputElement>(null);
  const questionRefs = useRef<Record<string, HTMLFieldSetElement | null>>({});
  const fallback = definition.defaultLocale;

  const setAnswer = (question: Question, value: Answers[string] | null) => {
    setAnswers((prev) => {
      const next = { ...prev };
      if (value === null) delete next[question.id];
      else next[question.id] = value;
      return next;
    });
    setMissing((prev) => prev.filter((id) => id !== question.id));
  };

  const submit = () => {
    const unanswered = unansweredRequired(definition.questions, answers);
    setMissing(unanswered);
    if (unanswered.length > 0) {
      questionRefs.current[unanswered[0]]?.scrollIntoView({ behavior: "smooth", block: "center" });
      questionRefs.current[unanswered[0]]?.querySelector<HTMLElement>("button, textarea")?.focus({ preventScroll: true });
      return;
    }
    // Drop empty comments; keep everything else as answered.
    const cleaned = Object.fromEntries(Object.entries(answers).filter(([, a]) => !("text" in a) || a.text.trim() !== ""));
    if (mode.kind === "preview") {
      setDone(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await submitSurveyResponse({
        code: mode.code,
        versionId: mode.versionId,
        submissionId,
        locale,
        answers: cleaned,
        website: honeypot.current?.value ?? "",
      });
      if ("ok" in result) setDone(true);
      else setError(result.error);
    });
  };

  const thanksBody = textIn(definition.thankYou, locale, fallback) || labels.thanksBody;

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[460px] flex-col gap-4 bg-sand px-4 pt-6 pb-8">
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="truncate font-display text-lg font-bold">{organizationName}</span>
          {locationName && <span className="truncate text-sm text-muted-foreground">{locationName}</span>}
        </div>
        {otherLanguageHref && (
          <a
            href={otherLanguageHref}
            lang={locale === "ar" ? "en" : "ar"}
            className="shrink-0 rounded-control px-2 py-1.5 text-sm font-semibold text-ultramarine outline-none hover:underline focus-visible:shadow-focus"
          >
            {labels.otherLanguage}
          </a>
        )}
      </header>

      {done ? (
        <section role="status" className="flex flex-col items-center gap-4 rounded-card bg-ink px-6 py-12 text-center text-sand">
          <SatisMark tone="sand-zest" className="h-14 animate-in fade-in zoom-in-75 duration-200 ease-[var(--ease-pop)]" />
          <h1 className="text-[28px] leading-tight font-extrabold text-sand">{labels.thanksTitle}</h1>
          <p className="max-w-[300px] text-ink-200">{thanksBody}</p>
          {mode.kind === "preview" && (
            <>
              <p className="text-xs text-ink-300">{labels.previewThanks}</p>
              <button
                type="button"
                onClick={() => {
                  setAnswers({});
                  setDone(false);
                }}
                className="rounded-control px-3 py-2 text-sm font-semibold text-ultra-300 outline-none hover:underline focus-visible:shadow-focus"
              >
                {labels.startOver}
              </button>
            </>
          )}
        </section>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          {/* Honeypot for bots: hidden from people and assistive technology. */}
          <input ref={honeypot} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          {definition.questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              ref={(el) => {
                questionRefs.current[question.id] = el;
              }}
              question={question}
              title={textIn(question.title, locale, fallback)}
              locale={locale}
              fallback={fallback}
              labels={labels}
              hero={index === 0}
              answer={answers[question.id]}
              missing={missing.includes(question.id)}
              onAnswer={(value) => setAnswer(question, value)}
            />
          ))}

          {error && (
            <p role="alert" className="rounded-control bg-ember-50 px-3 py-2.5 text-sm text-ember-700">
              {error === "changed"
                ? labels.errorChanged
                : error === "rateLimited"
                  ? labels.errorRateLimited
                  : error === "unavailable"
                    ? labels.unavailableTitle
                    : labels.errorGeneric}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-control bg-ultramarine text-[15px] font-semibold text-white outline-none transition-colors duration-[140ms] ease-[var(--ease-standard)] hover:bg-ultra-600 focus-visible:shadow-focus active:translate-y-px disabled:opacity-70"
          >
            {pending && <Loader2 aria-hidden strokeWidth={1.75} className="size-4 animate-spin" />}
            {labels.submit}
          </button>
        </form>
      )}

      <footer className="mt-auto flex items-center justify-center gap-1.5 pt-4 text-xs text-muted-foreground">
        <span>{labels.poweredBy}</span>
        <SatisLogo size={13} tone="ink" locale={locale} />
      </footer>
    </div>
  );
}

function QuestionCard({
  ref,
  question,
  title,
  locale,
  fallback,
  labels,
  hero,
  answer,
  missing,
  onAnswer,
}: {
  ref: React.Ref<HTMLFieldSetElement>;
  question: Question;
  title: string;
  locale: Locale;
  fallback: Locale;
  labels: SurveyLabels;
  hero: boolean;
  answer: Answers[string] | undefined;
  missing: boolean;
  onAnswer: (value: Answers[string] | null) => void;
}) {
  const number = answer && "number" in answer ? answer.number : null;
  const selected = answer && "options" in answer ? answer.options : [];
  const errorId = `${question.id}-error`;

  return (
    <fieldset
      ref={ref}
      aria-describedby={missing ? errorId : undefined}
      className={cn(
        "flex scroll-m-6 flex-col gap-4 rounded-card border p-5",
        hero ? "border-ink bg-ink text-sand" : "border-border bg-white",
        missing && "border-ember-600 ring-1 ring-ember-600",
      )}
    >
      {/* Floated so the legend lays out like a normal heading inside the bordered card. */}
      <legend className="float-start flex w-full flex-col gap-1.5">
        <span className={cn("font-display leading-snug font-bold", hero ? "text-2xl text-sand" : "text-lg")}>{title}</span>
        {!question.required && <span className={cn("text-xs", hero ? "text-ink-300" : "text-muted-foreground")}>{labels.optional}</span>}
      </legend>

      {question.type === "rating" && (
        <div className="flex flex-col gap-3">
          <RatingSlices
            value={number ?? 0}
            onChange={(n) => onAnswer({ number: n })}
            size="lg"
            onDark={hero}
            label={title}
          />
          <div aria-hidden className={cn("flex justify-between text-xs", hero ? "text-ink-300" : "text-muted-foreground")}>
            <span>{labels.poor}</span>
            <span>{labels.excellent}</span>
          </div>
        </div>
      )}

      {question.type === "nps" && (
        <div className="flex flex-col gap-2.5">
          {/* Scores read left to right (0 → 10) in both languages, as numbers do. */}
          <div role="radiogroup" aria-label={title} dir="ltr" className="grid grid-cols-11 gap-1">
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={number === n}
                onClick={() => onAnswer({ number: n })}
                className={cn(
                  "flex h-10 cursor-pointer items-center justify-center rounded-sm text-sm font-semibold tabular outline-none transition-colors duration-[140ms] focus-visible:shadow-focus",
                  number === n
                    ? "bg-ultramarine text-white"
                    : hero
                      ? "bg-ink-700 text-sand hover:bg-ink-600"
                      : "bg-ink-50 text-ink hover:bg-ink-100",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <div aria-hidden dir="ltr" className={cn("flex justify-between text-xs", hero ? "text-ink-300" : "text-muted-foreground")}>
            <span lang={locale}>{labels.notLikely}</span>
            <span lang={locale}>{labels.veryLikely}</span>
          </div>
        </div>
      )}

      {(question.type === "single_choice" || question.type === "multiple_choice") && (
        <div
          role={question.type === "single_choice" ? "radiogroup" : "group"}
          aria-label={title}
          className="flex flex-col gap-2"
        >
          {question.type === "multiple_choice" && (
            <span className={cn("text-xs", hero ? "text-ink-300" : "text-muted-foreground")}>{labels.chooseAll}</span>
          )}
          {question.options.map((option) => {
            const checked = selected.includes(option.id);
            return (
              <button
                key={option.id}
                type="button"
                role={question.type === "single_choice" ? "radio" : "checkbox"}
                aria-checked={checked}
                onClick={() => {
                  if (question.type === "single_choice") return onAnswer({ options: [option.id] });
                  const next = checked ? selected.filter((id) => id !== option.id) : [...selected, option.id];
                  onAnswer(next.length ? { options: next } : null);
                }}
                className={cn(
                  "flex min-h-11 cursor-pointer items-center gap-3 rounded-control border px-3.5 py-2.5 text-start text-[15px] font-medium outline-none transition-colors duration-[140ms] focus-visible:shadow-focus",
                  checked
                    ? "border-ultramarine bg-ultra-50 text-ink"
                    : hero
                      ? "border-ink-600 text-sand hover:bg-ink-800"
                      : "border-input bg-white hover:bg-sand-100",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center border",
                    question.type === "single_choice" ? "rounded-full" : "rounded-xs",
                    checked ? "border-ultramarine bg-ultramarine text-white" : "border-ink-300",
                  )}
                >
                  {checked && <Check strokeWidth={2.5} className="size-3.5" />}
                </span>
                {textIn(option.label, locale, fallback)}
              </button>
            );
          })}
        </div>
      )}

      {question.type === "text" && (
        <textarea
          aria-label={title}
          rows={3}
          maxLength={1000}
          placeholder={labels.commentPlaceholder}
          value={answer && "text" in answer ? answer.text : ""}
          onChange={(e) => onAnswer(e.target.value ? { text: e.target.value } : null)}
          className={cn(
            "w-full resize-y rounded-control border px-3 py-2.5 text-base outline-none transition-[border-color,box-shadow] duration-[140ms] focus-visible:border-ultramarine focus-visible:shadow-focus",
            hero ? "border-ink-600 bg-ink-800 text-sand placeholder:text-ink-400" : "border-input bg-white placeholder:text-muted-foreground",
          )}
        />
      )}

      {missing && (
        <p id={errorId} className={cn("text-sm font-medium", hero ? "text-ember-200" : "text-ember-700")}>
          {labels.answerRequired}
        </p>
      )}
    </fieldset>
  );
}
