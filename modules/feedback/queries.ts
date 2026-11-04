import "server-only";
import { cache } from "react";
import { daysAgoIso } from "@/lib/dates";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { SurveyDefinition } from "@/modules/surveys/definition";
import { likePattern, PAGE_SIZE, type InboxFilters } from "./filters";

const LIST_COLUMNS =
  "id, status, is_read, is_important, csat_score, nps_score, rating_sentiment, comment_text, submitted_at, survey:surveys(name), location:locations(name), tags:response_tags(tag:feedback_tags(id, name)), analysis:response_analyses(sentiment, praise_themes, complaint_themes)";

/** One page of the inbox, newest first, plus the total matching the filters. */
export async function listResponses(organizationId: string, filters: InboxFilters) {
  const supabase = await createSupabaseServerClient();
  // A second, inner-joined embed narrows the list to one tag without hiding the response's other tags.
  // Likewise for an AI theme: the inner join keeps only responses whose analysis mentions it.
  const columns = [LIST_COLUMNS, filters.tag && "tagged:response_tags!inner(tag_id)", filters.theme && "themed:response_analyses!inner(themes)"].filter(Boolean).join(", ");
  let query = supabase
    .from("survey_responses")
    .select(columns as typeof LIST_COLUMNS, { count: "exact" })
    .eq("organization_id", organizationId);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.sentiment) query = query.eq("rating_sentiment", filters.sentiment);
  if (filters.survey) query = query.eq("survey_id", filters.survey);
  if (filters.location) query = query.eq("location_id", filters.location);
  if (filters.tag) query = query.eq("tagged.tag_id", filters.tag);
  if (filters.theme) query = query.contains("themed.themes", [filters.theme]);
  if (filters.period !== "all") query = query.gte("submitted_at", daysAgoIso(Number(filters.period)));
  if (filters.unread) query = query.eq("is_read", false);
  if (filters.important) query = query.eq("is_important", true);
  if (filters.comments) query = query.eq("has_comment", true);
  if (filters.q) query = query.ilike("comment_text", likePattern(filters.q));

  const from = (filters.page - 1) * PAGE_SIZE;
  const { data, count, error } = await query
    .order("submitted_at", { ascending: false })
    .order("id", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return { rows: data ?? [], total: count ?? 0 };
}

export type InboxRow = Awaited<ReturnType<typeof listResponses>>["rows"][number];

/** Surveys, locations and tags of the business, for the filter menus. */
export const getFilterOptions = cache(async (organizationId: string) => {
  const supabase = await createSupabaseServerClient();
  const [surveys, locations, tags] = await Promise.all([
    supabase.from("surveys").select("id, name").eq("organization_id", organizationId).neq("status", "draft").order("name"),
    supabase.from("locations").select("id, name").eq("organization_id", organizationId).order("name"),
    listTags(organizationId),
  ]);
  return { surveys: surveys.data ?? [], locations: locations.data ?? [], tags };
});

export const listTags = cache(async (organizationId: string) => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("feedback_tags").select("id, name").eq("organization_id", organizationId).order("name");
  return data ?? [];
});

export const countUnread = cache(async (organizationId: string) => {
  const supabase = await createSupabaseServerClient();
  const { count } = await supabase
    .from("survey_responses")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("is_read", false);
  return count ?? 0;
});

export type ResponseAnswer = { number?: number; text?: string; options?: string[] };

/** A response with every answer and the exact survey version the customer saw. */
export const getResponse = cache(async (organizationId: string, responseId: string) => {
  if (!/^[0-9a-f-]{36}$/i.test(responseId)) return null;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("survey_responses")
    .select(
      "id, status, is_read, is_important, csat_score, nps_score, rating_sentiment, locale, device_type, submitted_at, survey_id, survey:surveys(name), location:locations(name), version:survey_versions(definition), tags:response_tags(tag:feedback_tags(id, name)), analysis:response_analyses(sentiment, praise_themes, complaint_themes)",
    )
    .eq("id", responseId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  if (!data) return null;

  const { data: answers } = await supabase
    .from("survey_answers")
    .select("question_id, value_number, value_text, value_option_ids")
    .eq("response_id", responseId);
  const byQuestion = new Map<string, ResponseAnswer>(
    (answers ?? []).map((a) => [
      a.question_id,
      { number: a.value_number ?? undefined, text: a.value_text ?? undefined, options: a.value_option_ids ?? undefined },
    ]),
  );
  // Versions are frozen on publish by publish_survey, so their JSON matches the definition shape.
  const definition = (data.version?.definition ?? { questions: [], thankYou: {}, locales: ["ar"], defaultLocale: "ar" }) as SurveyDefinition;
  return { ...data, definition, answers: byQuestion };
});

export type ResponseDetail = NonNullable<Awaited<ReturnType<typeof getResponse>>>;
