"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SatisLogo, SatisMark } from "@/components/brand/satis-mark";
import { RatingSlices, SliceHighlight } from "@/components/brand/slice";
import { cn } from "@/lib/utils";
import { ANSWERS, COPY, TOPICS, type Answer, type Locale, type Topic } from "./copy";

const TOP_SLICE = "40,4 98,4 68.3,30 10.3,30";

/** Mobile post-visit survey. Mirrors "06 Product UI" in the brand reference, EN and AR (RTL). */
export function SurveyScreen({ locale }: { locale: Locale }) {
  const t = COPY[locale];
  const ar = locale === "ar";
  const [rating, setRating] = useState(0);
  const [answers, setAnswers] = useState<Partial<Record<Topic, Answer>>>({});
  const [open, setOpen] = useState<Topic | null>(null);
  const [sent, setSent] = useState(false);

  const choose = (topic: Topic, answer: Answer) => {
    setAnswers((prev) => ({ ...prev, [topic]: answer }));
    setOpen(null);
  };

  return (
    <main
      lang={locale}
      dir={ar ? "rtl" : "ltr"}
      className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col gap-3.5 bg-sand px-4 pt-6 pb-4"
    >
      <header className="flex items-center justify-between">
        <SatisLogo size={ar ? 17 : 18} locale={locale} />
        <span
          aria-hidden
          className="flex size-[30px] items-center justify-center rounded-full bg-border text-[11px] font-semibold"
        >
          {t.initials}
        </span>
      </header>

      {sent ? (
        <ThankYou locale={locale} topScore={rating === 5} onEdit={() => setSent(false)} />
      ) : (
        <>
          <section className="relative overflow-hidden rounded-card bg-ink p-[18px] text-sand">
            <svg
              aria-hidden
              viewBox={ar ? "8 0 60 32" : "40 0 60 32"}
              preserveAspectRatio={ar ? "xMinYMin slice" : "xMaxYMin slice"}
              className="absolute top-0 h-[30px] w-[28%] fill-ultramarine ltr:right-0 rtl:left-0"
            >
              <polygon points={TOP_SLICE} />
            </svg>
            <div className="relative flex flex-col gap-3">
              <p className="mt-[18px] text-xs text-ink-300">{t.eyebrow(t.store)}</p>
              <h1
                className={cn(
                  "text-sand",
                  ar ? "font-arabic text-[26px] leading-[1.3]" : "text-[28px] font-extrabold leading-[1.05]",
                )}
              >
                {t.question}
              </h1>
              <div className="flex justify-between text-xs" aria-hidden>
                <span className="font-semibold">{t.poor}</span>
                <span className="text-ink-300">{t.excellent}</span>
              </div>
              <RatingSlices
                value={rating}
                onChange={setRating}
                size="sm"
                onDark
                className="gap-[3px]"
              />
            </div>
          </section>

          <h2 className={cn("text-muted-foreground", ar ? "font-arabic text-[13px] font-semibold" : "eyebrow font-sans")}>
            {t.stoodOut}
          </h2>
          <ul className="flex flex-col rounded-card border border-border bg-white">
            {TOPICS.map((topic) => {
              const answer = answers[topic];
              const expanded = open === topic;
              return (
                <li key={topic} className="border-b border-sand-100 last:border-b-0">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    onClick={() => setOpen(expanded ? null : topic)}
                    className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-card px-4 py-3.5 text-start outline-none focus-visible:shadow-focus"
                  >
                    <span className="text-sm font-medium">{t.topics[topic]}</span>
                    <span className="flex items-center gap-1.5">
                      <AnswerValue answer={answer} locale={locale} />
                      <ChevronDown
                        aria-hidden
                        strokeWidth={1.75}
                        className={cn(
                          "size-4 text-muted-foreground transition-transform duration-[140ms] ease-[var(--ease-standard)]",
                          expanded && "rotate-180",
                        )}
                      />
                    </span>
                  </button>
                  {expanded && (
                    <div role="radiogroup" aria-label={t.topics[topic]} className="flex gap-2 px-4 pb-3.5">
                      {ANSWERS.map((a) => (
                        <button
                          key={a}
                          type="button"
                          role="radio"
                          aria-checked={answer === a}
                          onClick={() => choose(topic, a)}
                          className={cn(
                            "h-9 flex-1 cursor-pointer rounded-control border text-[13px] font-semibold outline-none transition-colors duration-[140ms] ease-[var(--ease-standard)] focus-visible:shadow-focus active:translate-y-px",
                            answer === a
                              ? "border-ink bg-ink text-sand"
                              : "border-input bg-white text-ink hover:bg-sand-100",
                          )}
                        >
                          {t.answers[a]}
                        </button>
                      ))}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            disabled={rating === 0}
            onClick={() => setSent(true)}
            className="mt-auto h-12 w-full cursor-pointer rounded-control bg-ultramarine text-[15px] font-semibold text-white outline-none transition-colors duration-[140ms] ease-[var(--ease-standard)] hover:bg-ultra-600 focus-visible:shadow-focus active:translate-y-px disabled:cursor-not-allowed disabled:bg-ink-200 disabled:text-ink-500"
          >
            {t.submit}
          </button>
        </>
      )}
    </main>
  );
}

function AnswerValue({ answer, locale }: { answer?: Answer; locale: Locale }) {
  const t = COPY[locale];
  if (!answer) return <span className="text-[13px] text-muted-foreground">{t.choose}</span>;
  if (answer === "excellent") {
    return <SliceHighlight className="slice-sm px-2.5 py-[3px] text-xs">{t.answers.excellent}</SliceHighlight>;
  }
  if (answer === "improve") return <span className="text-[13px] font-semibold text-ember-700">{t.answers.improve}</span>;
  return <span className="text-[13px] text-muted-foreground">{t.answers.good}</span>;
}

function ThankYou({ locale, topScore, onEdit }: { locale: Locale; topScore: boolean; onEdit: () => void }) {
  const t = COPY[locale];
  return (
    <section
      role="status"
      className="flex flex-col items-center justify-center gap-4 rounded-card bg-ink px-6 py-12 text-center text-sand"
    >
      <SatisMark
        tone="sand-zest"
        className={cn(
          "h-14 animate-in fade-in zoom-in-75 duration-200",
          topScore && "duration-[320ms] ease-[var(--ease-pop)]",
        )}
      />
      <h1 className={cn("text-sand", locale === "ar" ? "font-arabic text-[26px] leading-[1.3]" : "text-[28px] font-extrabold leading-[1.05]")}>
        {t.thanksTitle}
      </h1>
      <p className="max-w-[260px] text-sm text-ink-300">{t.thanksBody}</p>
      <button
        type="button"
        onClick={onEdit}
        className="cursor-pointer rounded-control px-3 py-2 text-sm font-semibold text-ultra-300 underline-offset-4 outline-none hover:underline focus-visible:shadow-focus"
      >
        {t.edit}
      </button>
    </section>
  );
}
