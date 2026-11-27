import "server-only";
import { cache } from "react";
import { createSupabaseAnonClient } from "@/lib/supabase/anon";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { reportError } from "@/lib/observability/errors";
import type { BusinessType } from "@/types/database";
import type { Directory, ReviewPage, ScoreBadge, ScoreProfile } from "./definition";

// Public reads go through the session-less client: exactly what any visitor may see.

export async function getDirectory(query: string | null, type: BusinessType | null): Promise<Directory | null> {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_score_directory", { p_query: query, p_type: type, p_limit: 30 });
  if (error) {
    reportError(error, { area: "score", action: "directory" });
    return null;
  }
  return data as unknown as Directory;
}

export const getProfile = cache(async (slug: string): Promise<ScoreProfile | null> => {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_score_profile", { p_slug: slug });
  if (error) reportError(error, { area: "score", action: "profile" });
  return (data as unknown as ScoreProfile | null) ?? null;
});

export async function getReviews(slug: string, stars: number | null, limit: number): Promise<ReviewPage> {
  const supabase = createSupabaseAnonClient();
  const empty = { total: 0, items: [] };
  if (!supabase) return empty;
  const { data, error } = await supabase.rpc("get_score_reviews", { p_slug: slug, p_stars: stars, p_offset: 0, p_limit: limit });
  if (error) reportError(error, { area: "score", action: "reviews" });
  return (data as unknown as ReviewPage | null) ?? empty;
}

export async function getBadge(slug: string): Promise<ScoreBadge | null> {
  const supabase = createSupabaseAnonClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_score_badge", { p_slug: slug });
  if (error) reportError(error, { area: "score", action: "badge" });
  return (data as unknown as ScoreBadge | null) ?? null;
}

/** The team's view: page settings and this year's numbers, whether or not the page is on. */
export async function getScoreSettings(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);
  const rated = () =>
    supabase
      .from("survey_responses")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("submitted_at", since.toISOString());
  const published = () => rated().eq("publish_consent", true).not("comment_text", "is", null).not("csat_score", "is", null).is("public_hidden_at", null);

  const [org, published_, waiting, ...stars] = await Promise.all([
    supabase
      .from("organizations")
      .select("public_enabled, public_reviews_enabled, public_slug, public_about, public_website")
      .eq("id", organizationId)
      .single(),
    published(),
    published().lte("csat_score", 3).is("public_reply", null),
    ...[1, 2, 3, 4, 5].map((n) => rated().eq("csat_score", n)),
  ]);
  const counts = stars.map((s) => s.count ?? 0);
  const ratings = counts.reduce((a, b) => a + b, 0);
  const sum = counts.reduce((a, n, i) => a + n * (i + 1), 0);
  return {
    page: org.data,
    ratings,
    average: ratings > 0 ? sum / ratings : null,
    satisfied: counts[3] + counts[4],
    published: published_.count ?? 0,
    waiting: waiting.count ?? 0,
  };
}
