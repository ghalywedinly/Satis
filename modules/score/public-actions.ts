"use server";

import { captureServerEvent } from "@/lib/observability/analytics";
import { reportError } from "@/lib/observability/errors";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publishReviewSchema } from "./schemas";

/**
 * Public: the customer agreed, on the thank-you screen, to publish their comment on Satis Score.
 * The submission id their browser generated proves it's their own response (checked again by
 * the database, which also allows it only within a day of answering).
 */
export async function publishReview(input: { submissionId: string; name: string }): Promise<{ ok: boolean }> {
  const parsed = publishReviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  if (!(await consumeRateLimit("surveySubmit", `${await clientIp()}:publish`))) return { ok: false };

  const supabase = createSupabaseAdminClient();
  if (!supabase) return { ok: false };
  const { data, error } = await supabase.rpc("publish_review", { p_submission_id: parsed.data.submissionId, p_name: parsed.data.name });
  if (error) {
    reportError(error, { area: "score", action: "publish" });
    return { ok: false };
  }
  if (data) captureServerEvent("review_published", parsed.data.submissionId, {});
  return { ok: data === true };
}

