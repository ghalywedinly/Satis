import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getProfile } from "@/lib/auth/session";
import { daysAgoIso } from "@/lib/dates";
import { formatCount } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { captureServerEvent } from "@/lib/observability/analytics";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateSurveyButton } from "@/modules/surveys/components/create-survey-button";

export async function generateMetadata({ params }: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("metaTitle") };
}

// Analytics, trends and insights arrive in Phase 5; for now: the essentials and the next step.
export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const locale = await resolveLocale(params);
  const { user, membership } = await requireMembership(locale);
  const organizationId = membership.organization.id;
  const supabase = await createSupabaseServerClient();
  const weekAgo = daysAgoIso(7);
  const [profile, t, surveys, responses] = await Promise.all([
    getProfile(user.id),
    getTranslations({ locale, namespace: "dashboard" }),
    supabase.from("surveys").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).neq("status", "archived"),
    supabase
      .from("survey_responses")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId)
      .gte("submitted_at", weekAgo),
  ]);
  captureServerEvent("dashboard_viewed", user.id, { locale, organization_id: organizationId });
  const name = profile?.full_name?.split(" ")[0];
  const surveyCount = surveys.count ?? 0;

  const stats = [
    { label: t("surveysCount"), value: surveyCount },
    { label: t("responsesWeek"), value: responses.count ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-extrabold sm:text-4xl">{name ? t("welcome", { name }) : t("welcomeNoName")}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {stats.map((stat) => (
          <Card key={stat.label} className="gap-2 px-6">
            <p className="eyebrow">{stat.label}</p>
            <p className="font-display text-5xl font-extrabold tabular">{formatCount(locale, stat.value)}</p>
          </Card>
        ))}
      </div>
      {surveyCount === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-start gap-4">
            <h2 className="text-xl font-bold">{t("createSurvey")}</h2>
            <p className="text-muted-foreground">{t("createSurveyBody")}</p>
            {can(membership.role, "surveys.manage") && <CreateSurveyButton label={t("createSurvey")} />}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/surveys">{t("viewSurveys")}</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/locations">{t("manageLocations")}</Link>
          </Button>
          {can(membership.role, "members.manage") && (
            <Button asChild variant="outline">
              <Link href="/team">{t("inviteTeam")}</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
