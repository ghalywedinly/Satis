"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import type { ErrorKey } from "@/lib/forms";
import { getPathname } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
import { reportError } from "@/lib/observability/errors";
import { getActiveMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { publishIssues, type PublishIssue, type SurveyDraft } from "./definition";
import { draftSchema } from "./schemas";
import { ensureLinks } from "./links";
import { buildTemplateDraft } from "./template";

const id = z.uuid();

async function authorize(locale: Locale) {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, "surveys.manage")) return null;
  return { user, organizationId: membership.organization.id, defaultLocale: membership.organization.default_locale };
}

/** Creates a survey from the ready-made template. Returns its id. */
async function createFromTemplate(locale: Locale) {
  const auth = await authorize(locale);
  if (!auth) return { error: "forbidden" as const };
  const draft = await buildTemplateDraft(auth.defaultLocale);
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("surveys")
    .insert({
      organization_id: auth.organizationId,
      name: draft.name,
      locales: draft.locales,
      default_locale: draft.defaultLocale,
      questions: draft.questions,
      thank_you: draft.thankYou,
    })
    .select("id")
    .single();
  if (error || !data) return { error: dbErrorKey(error) };
  captureServerEvent("survey_created", auth.user.id, { organization_id: auth.organizationId, source: "template" });
  return { surveyId: data.id, auth, supabase };
}

export async function createSurvey(locale: Locale): Promise<ErrorKey | null> {
  const result = await createFromTemplate(locale);
  if ("error" in result) return result.error ?? "generic";
  redirect(getPathname({ locale, href: `/surveys/${result.surveyId}` }));
}

/** Onboarding step 5: create the template survey, publish it, and continue to its QR code. */
export async function createAndPublishFirstSurvey(locale: Locale): Promise<ErrorKey | null> {
  const result = await createFromTemplate(locale);
  if ("error" in result) return result.error ?? "generic";
  const published = await publishAndLink(result.surveyId, result.auth.organizationId, result.auth.user.id);
  if (published) return published;
  redirect(getPathname({ locale, href: `/onboarding/qr?survey=${result.surveyId}` }));
}

export type SaveResult = { error?: ErrorKey; issues?: PublishIssue[] };

export async function saveSurveyDraft(locale: Locale, surveyId: string, draft: SurveyDraft): Promise<SaveResult> {
  const auth = await authorize(locale);
  if (!auth) return { error: "forbidden" };
  const parsed = draftSchema.safeParse(draft);
  if (!id.safeParse(surveyId).success || !parsed.success) return { error: "generic" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("surveys")
    .update({
      name: parsed.data.name,
      locales: parsed.data.locales,
      default_locale: parsed.data.defaultLocale,
      questions: parsed.data.questions,
      thank_you: parsed.data.thankYou,
    })
    .eq("id", surveyId)
    .eq("organization_id", auth.organizationId)
    .select("id");
  if (error || !data?.length) return { error: error ? dbErrorKey(error) : "notFoundItem" };
  refresh();
  return {};
}

/** Saves the draft, checks it's complete in every language, publishes it and creates QR links. */
export async function publishSurvey(locale: Locale, surveyId: string, draft: SurveyDraft): Promise<SaveResult> {
  const parsed = draftSchema.safeParse(draft);
  if (parsed.success) {
    const issues = publishIssues(parsed.data);
    if (issues.length > 0) return { issues };
  }
  const saved = await saveSurveyDraft(locale, surveyId, draft);
  if (saved.error) return saved;
  const auth = await authorize(locale);
  if (!auth) return { error: "forbidden" };

  const error = await publishAndLink(surveyId, auth.organizationId, auth.user.id);
  if (error) return { error };
  refresh();
  return {};
}

async function publishAndLink(surveyId: string, organizationId: string, userId: string): Promise<ErrorKey | null> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("publish_survey", { p_survey_id: surveyId });
  if (error) return dbErrorKey(error);
  captureServerEvent("survey_published", userId, { organization_id: organizationId });
  try {
    const created = await ensureLinks(supabase, organizationId, surveyId);
    if (created > 0) captureServerEvent("qr_generated", userId, { organization_id: organizationId, count: created });
  } catch (linkError) {
    reportError(linkError, { area: "surveys", action: "create-links" });
    return "generic";
  }
  return null;
}

export async function setSurveyStatus(locale: Locale, surveyId: string, status: "published" | "paused"): Promise<ErrorKey | null> {
  if (!(await authorize(locale))) return "forbidden";
  if (!id.safeParse(surveyId).success) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("set_survey_status", { p_survey_id: surveyId, p_status: status });
  if (error) return dbErrorKey(error);
  refresh();
  return null;
}

export async function createMissingLinks(locale: Locale, surveyId: string): Promise<ErrorKey | null> {
  const auth = await authorize(locale);
  if (!auth) return "forbidden";
  if (!id.safeParse(surveyId).success) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  try {
    const created = await ensureLinks(supabase, auth.organizationId, surveyId);
    if (created > 0) captureServerEvent("qr_generated", auth.user.id, { organization_id: auth.organizationId, count: created });
  } catch (error) {
    return dbErrorKey(error as { code?: string; message?: string });
  }
  refresh();
  return null;
}

export async function setLinkActive(locale: Locale, linkId: string, active: boolean): Promise<ErrorKey | null> {
  const auth = await authorize(locale);
  if (!auth) return "forbidden";
  if (!id.safeParse(linkId).success) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("survey_links")
    .update({ is_active: active })
    .eq("id", linkId)
    .eq("organization_id", auth.organizationId)
    .select("id");
  if (error || !data?.length) return error ? dbErrorKey(error) : "notFoundItem";
  refresh();
  return null;
}
