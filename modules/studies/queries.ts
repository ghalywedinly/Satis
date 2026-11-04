import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Question, SurveyDefinition } from "@/modules/surveys/definition";
import type { Phase, StudyResponse } from "./report";

const SURVEY_COLUMNS = "id, name, status, study_phase, questions, current_version_id, has_unpublished_changes, updated_at";

/** The business's studies with their two surveys and how many answers each has. */
export async function listStudies(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("studies")
    .select("id, name, description, match_participants, created_at")
    .eq("organization_id", organizationId)
    .is("archived_at", null)
    .order("created_at", { ascending: false });
  const studies = data ?? [];
  if (studies.length === 0) return [];

  const { data: surveys } = await supabase
    .from("surveys")
    .select("id, study_id, study_phase, status")
    .eq("organization_id", organizationId)
    .in(
      "study_id",
      studies.map((s) => s.id),
    );
  const counts = new Map(
    await Promise.all(
      (surveys ?? []).map(async (s) => {
        const { count } = await supabase.from("survey_responses").select("id", { count: "exact", head: true }).eq("survey_id", s.id);
        return [s.id, count ?? 0] as const;
      }),
    ),
  );
  return studies.map((study) => {
    const phase = (p: Phase) => {
      const survey = surveys?.find((s) => s.study_id === study.id && s.study_phase === p);
      return survey ? { id: survey.id, status: survey.status, responses: counts.get(survey.id) ?? 0 } : null;
    };
    return { ...study, pre: phase("pre"), post: phase("post") };
  });
}

/** A study of the business, its two surveys, and the questions participants were asked. */
export const getStudy = cache(async (organizationId: string, studyId: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(studyId)) return null;
  const supabase = await createSupabaseServerClient();
  const { data: study } = await supabase
    .from("studies")
    .select("id, name, description, match_participants, archived_at, created_at")
    .eq("id", studyId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!study) return null;

  const { data: surveys } = await supabase.from("surveys").select(SURVEY_COLUMNS).eq("study_id", studyId).eq("organization_id", organizationId);
  const versionIds = (surveys ?? []).map((s) => s.current_version_id).filter((v): v is string => !!v);
  const { data: versions } = versionIds.length
    ? await supabase.from("survey_versions").select("id, definition").in("id", versionIds)
    : { data: [] as { id: string; definition: unknown }[] };

  const phase = (p: Phase) => {
    const survey = surveys?.find((s) => s.study_phase === p);
    if (!survey) return null;
    const published = versions?.find((v) => v.id === survey.current_version_id)?.definition as SurveyDefinition | undefined;
    return {
      ...survey,
      /** What participants answered (the published version), or the draft before publishing. */
      reportQuestions: (published?.questions ?? (survey.questions as Question[])) as Question[],
      defaultLocale: published?.defaultLocale,
    };
  };
  return { ...study, pre: phase("pre"), post: phase("post") };
});

export type StudyDetail = NonNullable<Awaited<ReturnType<typeof getStudy>>>;

/** Every response of the study with its answers (row level security applies). */
export async function getStudyResponses(studyId: string): Promise<StudyResponse[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("get_study_responses", { p_study_id: studyId });
  if (error) throw error;
  return (data as StudyResponse[] | null) ?? [];
}

/** True when the post-survey's draft asks the same questions as the pre-survey's. */
export function draftsMatch(study: StudyDetail): boolean {
  if (!study.pre || !study.post) return true;
  return JSON.stringify(study.pre.questions) === JSON.stringify(study.post.questions);
}
