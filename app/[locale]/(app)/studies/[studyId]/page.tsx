import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronLeft, Download, KeyRound, PencilLine, QrCode, TriangleAlert } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/i18n/format";
import { getPathname, Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { CopyQuestionsButton } from "@/modules/studies/components/copy-questions-button";
import { StudyForm } from "@/modules/studies/components/study-form";
import { StudyReportView } from "@/modules/studies/components/study-report";
import { draftsMatch, getStudy, getStudyResponses, type StudyDetail } from "@/modules/studies/queries";
import { buildReport, type Phase } from "@/modules/studies/report";
import { SurveyStatusBadge } from "@/modules/surveys/components/survey-status-badge";

export async function generateMetadata({ params }: PageProps<"/[locale]/studies/[studyId]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { studyId } = await params;
  const { membership } = await requireMembership(locale);
  const study = await getStudy(membership.organization.id, studyId);
  return { title: study?.name };
}

export default async function StudyPage({ params }: PageProps<"/[locale]/studies/[studyId]">) {
  const locale = await resolveLocale(params);
  const { studyId } = await params;
  const { membership } = await requireMembership(locale);
  const study = await getStudy(membership.organization.id, studyId);
  if (!study || !study.pre || !study.post) notFound();
  const canManage = can(membership.role, "surveys.manage");
  const t = await getTranslations({ locale, namespace: "studies" });

  const responses = await getStudyResponses(study.id);
  const report = buildReport({
    pre: study.pre.reportQuestions,
    post: study.post.reportQuestions,
    responses,
    matchParticipants: study.match_participants,
  });
  const supabase = await createSupabaseServerClient();
  const { data: link } = await supabase.from("survey_links").select("public_code").eq("survey_id", study.pre.id).eq("is_active", true).limit(1).maybeSingle();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <Link href="/studies" className="flex items-center gap-1 self-start rounded-control text-sm font-semibold text-muted-foreground outline-none hover:text-ink focus-visible:shadow-focus">
          <ChevronLeft aria-hidden strokeWidth={1.75} className="size-4 rtl:-scale-x-100" />
          {t("backToStudies")}
        </Link>
        <div className="flex flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold">{study.name}</h1>
          {study.description && <p className="max-w-[70ch] whitespace-pre-line text-muted-foreground">{study.description}</p>}
        </div>
        {canManage && (
          <details className="group max-w-2xl rounded-card border border-border bg-white/70 open:bg-white">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-card px-5 py-3.5 text-sm font-semibold outline-none focus-visible:shadow-focus [&::-webkit-details-marker]:hidden">
              <PencilLine aria-hidden strokeWidth={1.75} className="size-4" />
              {t("details.edit")}
            </summary>
            <div className="border-t border-border px-5 py-5">
              <StudyForm
                mode="edit"
                studyId={study.id}
                initial={{ name: study.name, description: study.description ?? "", matchParticipants: study.match_participants }}
              />
            </div>
          </details>
        )}
      </div>

      <section aria-labelledby="study-surveys" className="flex flex-col gap-4">
        <h2 id="study-surveys" className="text-xl font-extrabold">
          {t("surveys.title")}
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          {(["pre", "post"] as const).map((phase) => (
            <SurveyCard key={phase} phase={phase} study={study} responses={report.responses[phase]} canManage={canManage} t={t} locale={locale} />
          ))}
        </div>
        {study.match_participants && (
          <div className="flex gap-3 rounded-tile border border-border bg-white/70 p-4 text-sm">
            <KeyRound aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0 text-ultramarine" />
            <div className="flex flex-col gap-1">
              <span className="font-semibold">{t("surveys.codesTitle")}</span>
              <span className="text-muted-foreground">{t("surveys.codesBody")}</span>
              <bdi dir="ltr" className="font-mono text-xs">
                {t("surveys.codesExample", { code: link?.public_code ?? "…" })}
              </bdi>
            </div>
          </div>
        )}
      </section>

      <section aria-labelledby="study-results" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="study-results" className="text-xl font-extrabold">
            {t("report.title")}
          </h2>
          {responses.length > 0 && (
            <Button asChild variant="outline">
              <a href={getPathname({ locale, href: `/studies/${study.id}/export` })} download>
                <Download aria-hidden strokeWidth={1.75} />
                {t("report.export")}
              </a>
            </Button>
          )}
        </div>
        <StudyReportView locale={locale} report={report} fallback={study.pre.defaultLocale ?? membership.organization.default_locale} />
      </section>
    </div>
  );
}

type T = Awaited<ReturnType<typeof getTranslations<"studies">>>;

function SurveyCard({
  phase,
  study,
  responses,
  canManage,
  t,
  locale,
}: {
  phase: Phase;
  study: StudyDetail;
  responses: number;
  canManage: boolean;
  t: T;
  locale: "ar" | "en";
}) {
  const survey = study[phase]!;
  const differs = phase === "post" && !draftsMatch(study);
  return (
    <div className="flex flex-col gap-4 rounded-card border border-border bg-white p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className={cn("slice-sm flex h-8 w-14 shrink-0 items-center justify-center text-xs font-bold", phase === "pre" ? "bg-ink text-sand" : "bg-ultramarine text-white")}
        >
          {t(`phase.${phase}`)}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate text-base">{t(`phaseLong.${phase}`)}</h3>
          <span className="truncate text-sm text-muted-foreground">{survey.name}</span>
        </div>
        <SurveyStatusBadge status={survey.status} />
      </div>
      <p className="font-display text-3xl leading-none font-extrabold tracking-[-0.03em] tabular">
        {t("answers", { count: formatCount(locale, responses) })}
      </p>
      {differs && (
        <div className="flex flex-col gap-3 rounded-tile bg-ember-50 p-3.5 text-sm text-ember-700">
          <p className="flex gap-2">
            <TriangleAlert aria-hidden strokeWidth={1.75} className="mt-0.5 size-4 shrink-0" />
            {t("surveys.differ")}
          </p>
          {canManage && <CopyQuestionsButton studyId={study.id} />}
        </div>
      )}
      <div className="mt-auto flex flex-wrap gap-2">
        <Button asChild variant={canManage ? "default" : "outline"}>
          <Link href={`/surveys/${survey.id}`}>
            <PencilLine aria-hidden strokeWidth={1.75} />
            {t("surveys.edit")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={`/surveys/${survey.id}/share`}>
            <QrCode aria-hidden strokeWidth={1.75} />
            {t("surveys.share")}
          </Link>
        </Button>
      </div>
    </div>
  );
}
