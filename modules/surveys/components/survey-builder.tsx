"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import type { ErrorKey } from "@/lib/forms";
import { formatCount } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { publishSurvey, saveSurveyDraft } from "../actions";
import { LIMITS, QUESTION_TYPES, type PublishIssue, type Question, type QuestionType, type SurveyDraft } from "../definition";
import { SurveyForm, type SurveyLabels } from "./survey-form";

const LOCALES: Locale[] = ["ar", "en"];

function newQuestion(type: QuestionType): Question {
  const id = crypto.randomUUID();
  const title = {};
  switch (type) {
    case "rating":
      return { id, type, required: true, title, role: null };
    case "single_choice":
    case "multiple_choice":
      return { id, type, required: false, title, options: [{ id: crypto.randomUUID(), label: {} }, { id: crypto.randomUUID(), label: {} }] };
    default:
      return { id, type, required: false, title };
  }
}

/** Survey builder (spec §13): settings, questions, thank-you message, live preview, save and publish. */
export function SurveyBuilder({
  surveyId,
  initialDraft,
  isLive,
  canManage,
  organizationName,
  labels,
}: {
  surveyId: string;
  initialDraft: SurveyDraft;
  isLive: boolean;
  canManage: boolean;
  organizationName: string;
  labels: Record<Locale, SurveyLabels>;
}) {
  const t = useTranslations("surveys");
  const tl = useTranslations("common.language");
  const te = useTranslations("errors");
  const uiLocale = useLocale();
  const [draft, setDraft] = useState(initialDraft);
  const [savedSnapshot, setSavedSnapshot] = useState(() => JSON.stringify(initialDraft));
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [issues, setIssues] = useState<PublishIssue[]>([]);
  const [previewLocale, setPreviewLocale] = useState<Locale>(initialDraft.defaultLocale);
  const [pending, startTransition] = useTransition();
  const dirty = JSON.stringify(draft) !== savedSnapshot;
  const nameId = useId();
  const defaultLocaleId = useId();
  const disabled = !canManage || pending;

  const update = (patch: Partial<SurveyDraft>) => setDraft((d) => ({ ...d, ...patch }));
  const updateQuestion = (index: number, question: Question) =>
    setDraft((d) => ({ ...d, questions: d.questions.map((q, i) => (i === index ? question : q)) }));
  const moveQuestion = (index: number, delta: number) =>
    setDraft((d) => {
      const questions = [...d.questions];
      const [moved] = questions.splice(index, 1);
      questions.splice(index + delta, 0, moved);
      return { ...d, questions };
    });
  const setCsat = (index: number, on: boolean) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, i) => (q.type === "rating" ? { ...q, role: on && i === index ? "csat" : null } : q)),
    }));
  const toggleLocale = (locale: Locale, on: boolean) => {
    const locales = LOCALES.filter((l) => (l === locale ? on : draft.locales.includes(l)));
    if (locales.length === 0) return;
    update({ locales, defaultLocale: locales.includes(draft.defaultLocale) ? draft.defaultLocale : locales[0] });
    if (!locales.includes(previewLocale)) setPreviewLocale(locales[0]);
  };

  const run = (action: "save" | "publish") =>
    startTransition(async () => {
      setMessage(null);
      setIssues([]);
      const result = action === "save" ? await saveSurveyDraft(uiLocale as Locale, surveyId, draft) : await publishSurvey(uiLocale as Locale, surveyId, draft);
      if (result.issues?.length) {
        setIssues(result.issues);
        return;
      }
      if (result.error) {
        setMessage({ tone: "error", text: te(result.error as ErrorKey) });
        return;
      }
      setSavedSnapshot(JSON.stringify(draft));
      setMessage({ tone: "success", text: action === "save" ? t("builder.saved") : t("builder.published") });
    });

  const previewDefinition = useMemo(
    () => ({ questions: draft.questions, thankYou: draft.thankYou, locales: draft.locales, defaultLocale: draft.defaultLocale }),
    [draft],
  );
  const languageName = (locale: Locale) => tl(locale);

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex min-w-0 flex-col gap-6">
        {!canManage && <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}

        <Card>
          <CardHeader>
            <CardTitle>
              <h2>{t("builder.settings")}</h2>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor={nameId}>{t("builder.name")}</Label>
              <Input id={nameId} value={draft.name} maxLength={120} disabled={disabled} onChange={(e) => update({ name: e.target.value })} />
              <p className="text-xs text-muted-foreground">{t("builder.nameHint")}</p>
            </div>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 text-sm font-medium">{t("builder.languages")}</legend>
              <div className="flex flex-wrap gap-4">
                {LOCALES.map((locale) => (
                  <label key={locale} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="size-4 accent-ultramarine"
                      checked={draft.locales.includes(locale)}
                      disabled={disabled || (draft.locales.length === 1 && draft.locales.includes(locale))}
                      onChange={(e) => toggleLocale(locale, e.target.checked)}
                    />
                    <span lang={locale}>{languageName(locale)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            {draft.locales.length > 1 && (
              <div className="flex flex-col gap-2">
                <Label htmlFor={defaultLocaleId}>{t("builder.defaultLanguage")}</Label>
                <NativeSelect
                  id={defaultLocaleId}
                  value={draft.defaultLocale}
                  disabled={disabled}
                  onChange={(e) => update({ defaultLocale: e.target.value as Locale })}
                >
                  {draft.locales.map((locale) => (
                    <option key={locale} value={locale} lang={locale}>
                      {languageName(locale)}
                    </option>
                  ))}
                </NativeSelect>
              </div>
            )}
          </CardContent>
        </Card>

        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold">{t("builder.questions")}</h2>
          {draft.questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              count={draft.questions.length}
              locales={draft.locales}
              disabled={disabled}
              onChange={(q) => updateQuestion(index, q)}
              onMove={(delta) => moveQuestion(index, delta)}
              onRemove={() => update({ questions: draft.questions.filter((_, i) => i !== index) })}
              onCsat={(on) => setCsat(index, on)}
            />
          ))}
          {canManage &&
            (draft.questions.length < LIMITS.questions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="self-start" disabled={pending}>
                    <Plus aria-hidden strokeWidth={1.75} />
                    {t("builder.addQuestion")}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {QUESTION_TYPES.map((type) => (
                    <DropdownMenuItem key={type} onSelect={() => update({ questions: [...draft.questions, newQuestion(type)] })}>
                      {t(`types.${type}`)}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <p className="text-sm text-muted-foreground">{t("builder.limitReached", { count: formatCount(uiLocale as Locale, LIMITS.questions) })}</p>
            ))}
        </section>

        <Card>
          <CardContent className="flex flex-col gap-4">
            {draft.locales.map((locale) => (
              <LocalizedTextarea
                key={locale}
                label={t("builder.thankYou", { language: languageName(locale) })}
                locale={locale}
                value={draft.thankYou[locale] ?? ""}
                maxLength={LIMITS.thankYou}
                disabled={disabled}
                onChange={(value) => update({ thankYou: { ...draft.thankYou, [locale]: value } })}
              />
            ))}
            <p className="text-xs text-muted-foreground">{t("builder.thankYouHint")}</p>
          </CardContent>
        </Card>

        {canManage && (
          <div className="sticky bottom-0 z-10 -mx-4 flex flex-col gap-3 border-t border-border bg-sand/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-card sm:border">
            {issues.length > 0 && (
              <div role="alert" className="rounded-control bg-ember-50 px-3 py-2.5 text-sm text-ember-700">
                <p className="font-semibold">{t("builder.issues.title")}</p>
                <ul className="mt-1 list-disc ps-5">
                  {issues.map((issue, i) => (
                    <li key={i}>
                      {issue.kind === "noQuestions"
                        ? t("builder.issues.noQuestions")
                        : issue.kind === "tooFewOptions"
                          ? t("builder.issues.tooFewOptions", { number: formatCount(uiLocale as Locale, issue.questionIndex + 1) })
                          : issue.kind === "missingTitle"
                            ? t("builder.issues.missingTitle", {
                                number: formatCount(uiLocale as Locale, issue.questionIndex + 1),
                                language: languageName(issue.locale),
                              })
                            : t("builder.issues.missingOption", {
                                number: formatCount(uiLocale as Locale, issue.questionIndex + 1),
                                option: formatCount(uiLocale as Locale, issue.optionIndex + 1),
                                language: languageName(issue.locale),
                              })}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {dirty && <span className="me-auto text-sm text-muted-foreground">{t("builder.unsaved")}</span>}
              <Button variant="outline" disabled={pending || !dirty} onClick={() => run("save")}>
                {t("builder.save")}
              </Button>
              <Button disabled={pending} onClick={() => run("publish")}>
                {isLive ? t("builder.publishChanges") : t("builder.publish")}
              </Button>
            </div>
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">{t("builder.preview")}</h2>
          {draft.locales.length > 1 && (
            <div role="radiogroup" aria-label={t("builder.previewLanguage")} className="flex rounded-control bg-sand-100 p-1">
              {draft.locales.map((locale) => (
                <button
                  key={locale}
                  type="button"
                  role="radio"
                  aria-checked={previewLocale === locale}
                  lang={locale}
                  onClick={() => setPreviewLocale(locale)}
                  className={cn(
                    "rounded-sm px-3 py-1 text-sm font-semibold outline-none focus-visible:shadow-focus",
                    previewLocale === locale ? "bg-white text-ink" : "text-muted-foreground",
                  )}
                >
                  {languageName(locale)}
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{t("builder.previewNote")}</p>
        <div
          lang={previewLocale}
          dir={previewLocale === "ar" ? "rtl" : "ltr"}
          className="h-[720px] overflow-y-auto rounded-[36px] border-[8px] border-ink bg-sand"
        >
          <SurveyForm
            key={`${previewLocale}-${draft.questions.length}`}
            definition={previewDefinition}
            locale={previewLocale}
            organizationName={organizationName}
            labels={labels[previewLocale]}
            mode={{ kind: "preview" }}
          />
        </div>
      </aside>
    </div>
  );
}

function QuestionEditor({
  question,
  index,
  count,
  locales,
  disabled,
  onChange,
  onMove,
  onRemove,
  onCsat,
}: {
  question: Question;
  index: number;
  count: number;
  locales: Locale[];
  disabled: boolean;
  onChange: (q: Question) => void;
  onMove: (delta: number) => void;
  onRemove: () => void;
  onCsat: (on: boolean) => void;
}) {
  const t = useTranslations("surveys");
  const tl = useTranslations("common.language");
  const uiLocale = useLocale() as Locale;
  const number = formatCount(uiLocale, index + 1);

  return (
    <Card className="gap-4 py-5">
      <div className="flex items-center justify-between gap-3 px-6">
        <div className="flex min-w-0 flex-col">
          <h3 className="font-sans text-sm font-semibold">{t("builder.questionNumber", { number })}</h3>
          <span className="text-xs text-muted-foreground">{t(`types.${question.type}`)}</span>
        </div>
        {!disabled && (
          <div className="flex shrink-0 items-center">
            <Button variant="ghost" size="icon-sm" disabled={index === 0} aria-label={t("builder.moveUp", { number })} onClick={() => onMove(-1)}>
              <ArrowUp aria-hidden strokeWidth={1.75} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={index === count - 1}
              aria-label={t("builder.moveDown", { number })}
              onClick={() => onMove(1)}
            >
              <ArrowDown aria-hidden strokeWidth={1.75} />
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label={t("builder.remove", { number })} onClick={onRemove}>
              <Trash2 aria-hidden strokeWidth={1.75} />
            </Button>
          </div>
        )}
      </div>
      <CardContent className="flex flex-col gap-4">
        {locales.map((locale) => (
          <LocalizedInput
            key={locale}
            label={t("builder.questionTitle", { language: tl(locale) })}
            locale={locale}
            value={question.title[locale] ?? ""}
            maxLength={LIMITS.title}
            disabled={disabled}
            onChange={(value) => onChange({ ...question, title: { ...question.title, [locale]: value } })}
          />
        ))}

        {(question.type === "single_choice" || question.type === "multiple_choice") && (
          <fieldset className="flex flex-col gap-3">
            <legend className="mb-1 text-sm font-medium">{t("builder.options")}</legend>
            {question.options.map((option, optionIndex) => {
              const optionNumber = formatCount(uiLocale, optionIndex + 1);
              return (
                <div key={option.id} className="flex items-end gap-2">
                  <div className={cn("grid flex-1 gap-2", locales.length > 1 && "sm:grid-cols-2")}>
                    {locales.map((locale) => (
                      <LocalizedInput
                        key={locale}
                        label={t("builder.optionLabel", { number: optionNumber, language: tl(locale) })}
                        locale={locale}
                        value={option.label[locale] ?? ""}
                        maxLength={LIMITS.option}
                        disabled={disabled}
                        onChange={(value) =>
                          onChange({
                            ...question,
                            options: question.options.map((o, i) => (i === optionIndex ? { ...o, label: { ...o.label, [locale]: value } } : o)),
                          })
                        }
                      />
                    ))}
                  </div>
                  {!disabled && (
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("builder.removeOption", { number: optionNumber })}
                      onClick={() => onChange({ ...question, options: question.options.filter((_, i) => i !== optionIndex) })}
                    >
                      <X aria-hidden strokeWidth={1.75} />
                    </Button>
                  )}
                </div>
              );
            })}
            {!disabled && question.options.length < LIMITS.options && (
              <Button
                variant="ghost"
                size="sm"
                className="self-start"
                onClick={() => onChange({ ...question, options: [...question.options, { id: crypto.randomUUID(), label: {} }] })}
              >
                <Plus aria-hidden strokeWidth={1.75} />
                {t("builder.addOption")}
              </Button>
            )}
          </fieldset>
        )}

        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-ultramarine"
              checked={question.required}
              disabled={disabled}
              onChange={(e) => onChange({ ...question, required: e.target.checked })}
            />
            {t("builder.required")}
          </label>
          {question.type === "rating" && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4 accent-ultramarine"
                checked={question.role === "csat"}
                disabled={disabled}
                onChange={(e) => onCsat(e.target.checked)}
              />
              {t("builder.useForCsat")}
            </label>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function LocalizedInput({
  label,
  locale,
  value,
  maxLength,
  disabled,
  onChange,
}: {
  label: string;
  locale: Locale;
  value: string;
  maxLength: number;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Input id={id} lang={locale} dir={locale === "ar" ? "rtl" : "ltr"} value={value} maxLength={maxLength} disabled={disabled} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function LocalizedTextarea({
  label,
  locale,
  value,
  maxLength,
  disabled,
  onChange,
}: {
  label: string;
  locale: Locale;
  value: string;
  maxLength: number;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        lang={locale}
        dir={locale === "ar" ? "rtl" : "ltr"}
        rows={2}
        value={value}
        maxLength={maxLength}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-control border border-input bg-white px-3 py-2 text-base outline-none transition-[border-color,box-shadow] duration-[140ms] focus-visible:border-ultramarine focus-visible:shadow-focus disabled:opacity-50 md:text-sm"
      />
    </div>
  );
}
