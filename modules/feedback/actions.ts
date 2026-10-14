"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
import { getActiveMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { STATUSES } from "./filters";

const id = z.uuid();
const triageSchema = z.union([
  z.object({ status: z.enum(STATUSES) }),
  z.object({ is_important: z.boolean() }),
  z.object({ is_read: z.boolean() }),
]);
const tagName = z.string().trim().min(1).max(40);

/** Staff and above triage the inbox; the database enforces the same rule. */
async function authorize(locale: Locale) {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, "feedback.triage")) return null;
  return { user, organizationId: membership.organization.id };
}

export type TriageChange = z.infer<typeof triageSchema>;

/** Changes one triage field: status, important or read. */
export async function updateResponse(locale: Locale, responseId: string, change: TriageChange): Promise<ErrorKey | null> {
  const auth = await authorize(locale);
  if (!auth) return "forbidden";
  const parsed = triageSchema.safeParse(change);
  if (!id.safeParse(responseId).success || !parsed.success) return "generic";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("survey_responses")
    .update(parsed.data)
    .eq("id", responseId)
    .eq("organization_id", auth.organizationId)
    .select("id");
  if (error || !data?.length) return error ? dbErrorKey(error) : "notFoundItem";
  // Opening a response marks it read; that isn't a decision worth counting.
  if (!("is_read" in parsed.data)) {
    captureServerEvent("response_triaged", auth.user.id, { organization_id: auth.organizationId, change: Object.keys(parsed.data)[0] });
  }
  refresh();
  return null;
}

export async function addTag(locale: Locale, responseId: string, name: string): Promise<ErrorKey | null> {
  const auth = await authorize(locale);
  if (!auth) return "forbidden";
  if (!id.safeParse(responseId).success) return "notFoundItem";
  if (!tagName.safeParse(name).success) return "invalidTag";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc("add_response_tag", { p_response_id: responseId, p_name: name });
  if (error) return dbErrorKey(error);
  captureServerEvent("response_tagged", auth.user.id, { organization_id: auth.organizationId });
  refresh();
  return null;
}

export async function removeTag(locale: Locale, responseId: string, tagId: string): Promise<ErrorKey | null> {
  const auth = await authorize(locale);
  if (!auth) return "forbidden";
  if (!id.safeParse(responseId).success || !id.safeParse(tagId).success) return "notFoundItem";

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("response_tags")
    .delete()
    .eq("response_id", responseId)
    .eq("tag_id", tagId)
    .eq("organization_id", auth.organizationId);
  if (error) return dbErrorKey(error);
  refresh();
  return null;
}
