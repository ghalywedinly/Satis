import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { formatCount, formatDate } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { ScoreBadge, SentimentBadge, StatusBadge } from "@/modules/feedback/components/badges";
import { TagEditor } from "@/modules/feedback/components/tag-editor";
import { MarkRead, TriageControls } from "@/modules/feedback/components/triage-controls";
import { filtersToQuery, parseFilters } from "@/modules/feedback/filters";
import { getResponse, listTags, type ResponseAnswer } from "@/modules/feedback/queries";
import { textIn, type Question } from "@/modules/surveys/definition";

export async function generateMetadata({ params }: PageProps<"/[locale]/inbox/[responseId]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "inbox.detail" });
  return { title: t("metaTitle") };
}

export default async function ResponsePage({ params, searchParams }: PageProps<"/[locale]/inbox/[responseId]">) {
  const locale = await resolveLocale(params);
  const { responseId } = await params;
  const { membership } = await requireMembership(locale);
  const organizationId = membership.organization.id;
  const [response, allTags, t, tCommon] = await Promise.all([
    getResponse(organizationId, responseId),
    listTags(organizationId),
    getTranslations({ locale, namespace: "inbox" }),
    getTranslations({ locale, namespace: "common" }),
  ]);
  if (!response) notFound();

  const canTriage = can(membership.role, "feedback.triage");
  const backHref = `/inbox${filtersToQuery(parseFilters(await searchParams))}`;
  const { definition } = response;
  const tags = response.tags.flatMap(({ tag }) => (tag ? [tag] : []));

  const answerText = (question: Question, answer: ResponseAnswer | undefined): string | null => {
    if (!answer) return null;
    if (question.type === "rating" && answer.number !== undefined) return t("csat", { score: formatCount(locale, answer.number) });
    if (question.type === "nps" && answer.number !== undefined) return t("nps", { score: formatCount(locale, answer.number) });
    if ((question.type === "single_choice" || question.type === "multiple_choice") && answer.options) {
      return question.options
        .filter((o) => answer.options!.includes(o.id))
        .map((o) => textIn(o.label, locale, definition.defaultLocale))
        .join(locale === "ar" ? "، " : ", ");
    }
    return answer.text ?? null;
  };

  const details: { label: string; value: string }[] = [
    { label: t("detail.survey"), value: response.survey?.name ?? "" },
    { label: t("detail.location"), value: response.location?.name ?? "" },
    {
      label: t("detail.submitted"),
      value: formatDate(locale, response.submitted_at, { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" }),
    },
    { label: t("detail.language"), value: tCommon(`language.${response.locale as Locale}`) },
    ...(response.device_type
      ? [{ label: t("detail.device"), value: t(`detail.devices.${response.device_type as "mobile" | "tablet" | "desktop"}`) }]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      {canTriage && !response.is_read && <MarkRead responseId={response.id} />}
      <Link href={backHref} className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-ultramarine underline-offset-4 hover:underline">
        <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4 rtl:-scale-x-100" />
        {t("detail.back")}
      </Link>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="sr-only">{t("detail.metaTitle")}</h1>
        <ScoreBadge csat={response.csat_score} nps={response.nps_score} sentiment={response.rating_sentiment} />
        <SentimentBadge sentiment={response.rating_sentiment} />
        <StatusBadge status={response.status} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="gap-0 p-0">
          <h2 className="border-b border-border px-6 py-4 text-lg font-bold">{t("detail.answers")}</h2>
          <dl className="flex flex-col divide-y divide-border">
            {definition.questions.map((question) => {
              const value = answerText(question, response.answers.get(question.id));
              return (
                <div key={question.id} className="flex flex-col gap-1.5 px-6 py-4">
                  <dt className="text-sm text-muted-foreground">{textIn(question.title, locale, definition.defaultLocale)}</dt>
                  <dd
                    dir={question.type === "text" ? "auto" : undefined}
                    className={value ? "text-start whitespace-pre-line text-ink" : "text-muted-foreground"}
                  >
                    {value ?? t("detail.noAnswer")}
                  </dd>
                </div>
              );
            })}
          </dl>
        </Card>

        <div className="flex flex-col gap-6">
          <Card className="gap-4 px-6">
            <h2 className="text-lg font-bold">{t("detail.triage")}</h2>
            {canTriage ? (
              <TriageControls key={`${response.status}-${response.is_important}`} responseId={response.id} status={response.status} isImportant={response.is_important} />
            ) : (
              <p className="text-sm text-muted-foreground">{t("readOnly")}</p>
            )}
            <h3 className="pt-2 font-sans text-sm font-semibold">{t("detail.tags")}</h3>
            <TagEditor responseId={response.id} tags={tags} allTags={allTags} canEdit={canTriage} />
          </Card>
          <Card className="gap-3 px-6">
            <h2 className="text-lg font-bold">{t("detail.details")}</h2>
            <dl className="flex flex-col gap-3 text-sm">
              {details.map((d) => (
                <div key={d.label} className="flex flex-col gap-0.5">
                  <dt className="text-muted-foreground">{d.label}</dt>
                  <dd className="font-medium">{d.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
