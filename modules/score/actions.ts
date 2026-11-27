"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsFrom, text, type ErrorKey, type FormState } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
import { getActiveMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeWebsite, replySchema, scoreSettingsSchema } from "./schemas";

export type ScoreSettingsField = "slug" | "about" | "website";

/** Turns the public page on or off and edits what it shows. Admins and owners. */
export async function updateScoreSettings(
  locale: Locale,
  _prev: FormState<ScoreSettingsField>,
  formData: FormData,
): Promise<FormState<ScoreSettingsField>> {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, "organization.edit")) return { status: "error", formError: "forbidden" };

  const raw = {
    slug: text(formData, "slug").trim().toLowerCase(),
    about: text(formData, "about"),
    website: normalizeWebsite(text(formData, "website")),
  };
  const parsed = scoreSettingsSchema.safeParse({
    ...raw,
    enabled: formData.get("enabled") === "on",
    reviewsEnabled: formData.get("reviewsEnabled") === "on",
  });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };
  const data = parsed.data;
  if (data.enabled && !data.slug) return { status: "error", fieldErrors: { slug: "required" }, formError: "slugRequired", values: raw };

  const supabase = await createSupabaseServerClient();
  const { data: rows, error } = await supabase
    .from("organizations")
    .update({
      public_enabled: data.enabled,
      public_reviews_enabled: data.reviewsEnabled,
      public_slug: data.slug || null,
      public_about: data.about || null,
      public_website: data.website || null,
    })
    .eq("id", membership.organization.id)
    .select("id");
  if (error?.code === "23505") return { status: "error", fieldErrors: { slug: "slug" }, formError: "slugTaken", values: raw };
  if (error || !rows?.length) return { status: "error", formError: error ? dbErrorKey(error) : "forbidden", values: raw };

  captureServerEvent("score_page_saved", user.id, { organization_id: membership.organization.id, enabled: data.enabled });
  refresh();
  return { status: "success", values: raw };
}

export type ReplyResult = { ok: true } | { error: ErrorKey };

/** Answers a published review in public, or removes the answer (empty text). Staff and above. */
export async function saveReviewReply(locale: Locale, input: { responseId: string; reply: string }): Promise<ReplyResult> {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, "feedback.triage")) return { error: "forbidden" };
  const parsed = replySchema.safeParse(input);
  if (!parsed.success) return { error: "generic" };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .update({ public_reply: parsed.data.reply || null })
    .eq("id", parsed.data.responseId)
    .eq("organization_id", membership.organization.id)
    .select("id");
  if (error || !data?.length) return { error: error ? dbErrorKey(error) : "forbidden" };

  if (parsed.data.reply) captureServerEvent("review_replied", user.id, { organization_id: membership.organization.id });
  refresh();
  return { ok: true };
}
