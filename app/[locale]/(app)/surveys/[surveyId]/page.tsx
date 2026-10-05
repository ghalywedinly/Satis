import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { SurveyBuilder } from "@/modules/surveys/components/survey-builder";
import { SurveyHeader } from "@/modules/surveys/components/survey-header";
import { getSurvey, surveyLabels, toDraft } from "@/modules/surveys/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/surveys/[surveyId]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { surveyId } = await params;
  const { membership } = await requireMembership(locale);
  const survey = await getSurvey(membership.organization.id, surveyId);
  return { title: survey?.name };
}

export default async function SurveyEditPage({ params }: PageProps<"/[locale]/surveys/[surveyId]">) {
  const locale = await resolveLocale(params);
  const { surveyId } = await params;
  const { membership } = await requireMembership(locale);
  const survey = await getSurvey(membership.organization.id, surveyId);
  if (!survey) notFound();
  const canManage = can(membership.role, "surveys.manage");

  return (
    <div className="flex flex-col gap-6">
      <SurveyHeader locale={locale} survey={survey} active="edit" canManage={canManage} />
      <SurveyBuilder
        surveyId={survey.id}
        initialDraft={toDraft(survey)}
        isLive={survey.current_version_id !== null}
        canManage={canManage}
        organizationName={membership.organization.name}
        labels={await surveyLabels()}
      />
    </div>
  );
}
