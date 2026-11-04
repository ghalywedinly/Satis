"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsFrom, text, type ErrorKey, type FormState } from "@/lib/forms";
import { getPathname } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
import { getActiveMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { newStudySchema, studySchema, type StudyField } from "./schemas";
import { buildStudyDraft } from "./template";

const id = z.uuid();

async function authorize(locale: Locale) {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, "surveys.manage")) return null;
  return { user, organizationId: membership.organization.id, defaultLocale: membership.organization.default_locale };
}

/** Creates a study with its pre- and post-survey, then opens it. */
export async function createStudy(locale: Locale, _prev: FormState<StudyField>, formData: FormData): Promise<FormState<StudyField>> {
  const raw = {
    name: text(formData, "name"),
    description: text(formData, "description"),
    matchParticipants: formData.get("matchParticipants") === "on",
    template: text(formData, "template") || "research",
  };
  const values = { name: raw.name, description: raw.description };
  const parsed = newStudySchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  const auth = await authorize(locale);
  if (!auth) return { status: "error", formError: "forbidden", values };

  const draft = await buildStudyDraft(parsed.data.template, auth.defaultLocale);
  const t = await getTranslations({ locale: auth.defaultLocale, namespace: "studies" });
  const supabase = await createSupabaseServerClient();
  const { data: studyId, error } = await supabase.rpc("create_study", {
    p_organization_id: auth.organizationId,
    p_name: parsed.data.name,
    p_description: parsed.data.description,
    p_match_participants: parsed.data.matchParticipants,
    p_pre_name: t("surveyName", { study: parsed.data.name, phase: t("phase.pre") }).slice(0, 120),
    p_post_name: t("surveyName", { study: parsed.data.name, phase: t("phase.post") }).slice(0, 120),
    p_locales: draft.locales,
    p_default_locale: draft.defaultLocale,
    p_questions: draft.questions,
    p_thank_you: draft.thankYou,
    p_theme: draft.theme,
  });
  if (error || !studyId) return { status: "error", formError: dbErrorKey(error), values };
  captureServerEvent("study_created", auth.user.id, {
    organization_id: auth.organizationId,
    template: parsed.data.template,
    match_participants: parsed.data.matchParticipants,
  });
  redirect(getPathname({ locale, href: `/studies/${studyId}` }));
}

/** Renames a study, edits its description, or turns participant matching on or off. */
export async function updateStudy(locale: Locale, studyId: string, _prev: FormState<StudyField>, formData: FormData): Promise<FormState<StudyField>> {
  const raw = {
    name: text(formData, "name"),
    description: text(formData, "description"),
    matchParticipants: formData.get("matchParticipants") === "on",
  };
  const values = { name: raw.name, description: raw.description };
  const parsed = studySchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values };
  const auth = await authorize(locale);
  if (!auth) return { status: "error", formError: "forbidden", values };
  if (!id.safeParse(studyId).success) return { status: "error", formError: "notFoundItem", values };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("studies")
    .update({ name: parsed.data.name, description: parsed.data.description || null, match_participants: parsed.data.matchParticipants })
    .eq("id", studyId)
    .eq("organization_id", auth.organizationId)
    .select("id");
  if (error || !data?.length) return { status: "error", formError: error ? dbErrorKey(error) : "notFoundItem", values };
  refresh();
  return { status: "success", values };
}

/**
 * Makes the post-survey's draft the same as the pre-survey's (questions, languages, design),
 * keeping question ids so every question is compared. Publish the post-survey afterwards.
 */
export async function copyPreToPost(locale: Locale, studyId: string): Promise<ErrorKey | null> {
  const auth = await authorize(locale);
  if (!auth) return "forbidden";
  if (!id.safeParse(studyId).success) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { data: surveys, error } = await supabase
    .from("surveys")
    .select("id, study_phase, questions, thank_you, locales, default_locale, theme")
    .eq("organization_id", auth.organizationId)
    .eq("study_id", studyId);
  if (error) return dbErrorKey(error);
  const pre = surveys?.find((s) => s.study_phase === "pre");
  const post = surveys?.find((s) => s.study_phase === "post");
  if (!pre || !post) return "notFoundItem";

  const { error: updateError } = await supabase
    .from("surveys")
    .update({ questions: pre.questions, thank_you: pre.thank_you, locales: pre.locales, default_locale: pre.default_locale, theme: pre.theme })
    .eq("id", post.id);
  if (updateError) return dbErrorKey(updateError);
  refresh();
  return null;
}
