"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { captureServerEvent } from "@/lib/observability/analytics";
import { reportError } from "@/lib/observability/errors";
import { clientIp, consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { answersSchema } from "./schemas";

export type SubmitResult = { ok: true } | { error: "generic" | "changed" | "rateLimited" | "unavailable" };

const inputSchema = z.object({
  code: z.string().regex(/^[A-Za-z0-9]{8,16}$/),
  versionId: z.uuid(),
  submissionId: z.uuid(),
  locale: z.enum(["ar", "en"]),
  answers: answersSchema,
  // Honeypot: a hidden field people never fill in, but naive bots do.
  website: z.string().max(200),
  elapsedMs: z.number().int().nonnegative(),
});

function deviceType(userAgent: string | null): "mobile" | "tablet" | "desktop" {
  if (!userAgent) return "desktop";
  if (/iPad|Tablet|PlayBook|Silk|(Android(?!.*Mobile))/i.test(userAgent)) return "tablet";
  if (/Mobi|iPhone|Android/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** Public: records a customer's answers. Validated again, fully, by the database. */
export async function submitSurveyResponse(input: z.input<typeof inputSchema>): Promise<SubmitResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { error: "generic" };
  const data = parsed.data;

  // Likely automated: pretend it worked, store nothing.
  if (data.website !== "" || data.elapsedMs < 800) return { ok: true };

  if (!(await consumeRateLimit("surveySubmit", `${await clientIp()}:${data.code}`))) return { error: "rateLimited" };

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    reportError(new Error("Survey submission needs SUPABASE_SECRET_KEY"), { area: "public-survey" });
    return { error: "generic" };
  }

  const device = deviceType((await headers()).get("user-agent"));
  const { error } = await supabase.rpc("submit_survey_response", {
    p_code: data.code,
    p_version_id: data.versionId,
    p_submission_id: data.submissionId,
    p_locale: data.locale,
    p_answers: data.answers,
    p_device_type: device,
  });
  if (error) {
    if (error.message === "survey_changed") return { error: "changed" };
    if (error.message === "survey_unavailable") return { error: "unavailable" };
    if (!["missing_answer", "invalid_answer"].includes(error.message)) reportError(error, { area: "public-survey" });
    return { error: "generic" };
  }

  captureServerEvent("survey_completed", data.submissionId, { locale: data.locale, device_type: device });
  return { ok: true };
}
