import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { OrgRole } from "@/types/database";

/** Roles that get both emails until they choose otherwise (matches notification_recipients). */
const ON_BY_DEFAULT: OrgRole[] = ["owner", "admin", "manager"];

/** The member's current choices: what they saved, or their role's default. */
export async function getNotificationPreferences(organizationId: string, userId: string, role: OrgRole) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("notification_preferences")
    .select("negative_alerts, weekly_report")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();
  const fallback = ON_BY_DEFAULT.includes(role);
  return { negativeAlerts: data?.negative_alerts ?? fallback, weeklyReport: data?.weekly_report ?? fallback };
}
