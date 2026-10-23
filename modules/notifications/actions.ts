"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import type { ErrorKey } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { getActiveMembership } from "@/lib/org/context";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const preferencesSchema = z.object({ negativeAlerts: z.boolean(), weeklyReport: z.boolean() }).strict();

/** Saves the signed-in member's own email choices for the active business. */
export async function saveNotificationPreferences(locale: Locale, input: z.input<typeof preferencesSchema>): Promise<ErrorKey | null> {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership) return "forbidden";
  const parsed = preferencesSchema.safeParse(input);
  if (!parsed.success) return "generic";

  const supabase = await createSupabaseServerClient();
  const values = { negative_alerts: parsed.data.negativeAlerts, weekly_report: parsed.data.weeklyReport };
  // Update first: members may only change the two choices, never the keys, so this isn't an upsert.
  const { data: updated, error } = await supabase
    .from("notification_preferences")
    .update(values)
    .eq("organization_id", membership.organization.id)
    .eq("user_id", user.id)
    .select("user_id");
  if (error) return dbErrorKey(error);
  if (!updated?.length) {
    const { error: insertError } = await supabase
      .from("notification_preferences")
      .insert({ organization_id: membership.organization.id, user_id: user.id, ...values });
    if (insertError) return dbErrorKey(insertError);
  }
  refresh();
  return null;
}
