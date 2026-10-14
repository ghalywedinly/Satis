import "server-only";
import { getTranslations } from "next-intl/server";
import { formatCount, formatDate } from "@/lib/i18n/format";
import { reportError } from "@/lib/observability/errors";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { appUrl, emailFrame, sendEach, type Recipient } from "./shared";

/**
 * Emails the team about an unhappy customer (a rating of 1–2, or a recommendation score of 0–6)
 * right after they answer. Runs after the customer's page has responded, so it never slows them
 * down, and it is capped per business so a burst of bad ratings can't flood anyone's inbox.
 */
export async function sendNegativeAlert(responseId: string): Promise<void> {
  try {
    const supabase = createSupabaseAdminClient();
    if (!supabase) return;
    const { data: response, error } = await supabase
      .from("survey_responses")
      .select("id, organization_id, csat_score, nps_score, rating_sentiment, comment_text, submitted_at, location:locations(name)")
      .eq("id", responseId)
      .maybeSingle();
    if (error) throw error;
    if (!response || response.rating_sentiment !== "negative") return;
    if (!(await consumeRateLimit("negativeAlert", response.organization_id))) return;

    const { data: recipients, error: recipientsError } = await supabase.rpc("notification_recipients", {
      p_organization_id: response.organization_id,
      p_kind: "negative_alert",
    });
    if (recipientsError) throw recipientsError;
    if (!recipients?.length) return;

    const { data: organization } = await supabase.from("organizations").select("name").eq("id", response.organization_id).maybeSingle();
    const business = organization?.name ?? "";
    const location = response.location?.name ?? business;
    await sendEach(
      recipients as Recipient[],
      async ({ locale }) => {
        const t = await getTranslations({ locale, namespace: "emails.negativeAlert" });
        const frame = await emailFrame(locale, business);
        const score =
          response.csat_score !== null
            ? t("rating", { score: formatCount(locale, response.csat_score) })
            : t("nps", { score: formatCount(locale, response.nps_score ?? 0) });
        return {
          subject: t("subject", { location }),
          props: {
            locale,
            appName: frame.appName,
            eyebrow: t("eyebrow", { business }),
            heading: t("heading", { location }),
            tone: "alert",
            lines: [score, t("when", { time: formatDate(locale, response.submitted_at, { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }) })],
            quote: response.comment_text ? { label: t("comment"), text: response.comment_text } : undefined,
            action: { label: t("button"), url: appUrl(locale, `/inbox/${response.id}`) },
            footer: frame.footer,
          },
        };
      },
      "negative-alert",
    );
  } catch (error) {
    reportError(error, { area: "notifications", action: "negative-alert" });
  }
}
