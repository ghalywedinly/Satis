import type { Metadata } from "next";
import { ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formatCount, formatDate } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateSurveyButton } from "@/modules/surveys/components/create-survey-button";
import { SurveyStatusBadge } from "@/modules/surveys/components/survey-status-badge";

export async function generateMetadata({ params }: PageProps<"/[locale]/surveys">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "surveys" });
  return { title: t("metaTitle") };
}

export default async function SurveysPage({ params }: PageProps<"/[locale]/surveys">) {
  const locale = await resolveLocale(params);
  const { membership } = await requireMembership(locale);
  const t = await getTranslations({ locale, namespace: "surveys" });
  const canManage = can(membership.role, "surveys.manage");

  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("surveys")
    .select("id, name, status, questions, has_unpublished_changes, updated_at")
    .eq("organization_id", membership.organization.id)
    .neq("status", "archived")
    .order("updated_at", { ascending: false });
  const surveys = data ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && <CreateSurveyButton />}
      </div>
      {!canManage && <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}
      {surveys.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col divide-y divide-border rounded-card border border-border bg-white">
          {surveys.map((survey) => (
            <li key={survey.id}>
              <Link
                href={`/surveys/${survey.id}`}
                className="flex items-center gap-4 rounded-card px-5 py-4 outline-none hover:bg-sand-50 focus-visible:shadow-focus"
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="truncate font-semibold">{survey.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {t("questionCount", { count: formatCount(locale, Array.isArray(survey.questions) ? survey.questions.length : 0) })}
                    {" · "}
                    {formatDate(locale, survey.updated_at)}
                    {survey.has_unpublished_changes && ` · ${t("unpublishedChanges")}`}
                  </span>
                </div>
                <SurveyStatusBadge status={survey.status} />
                <ChevronRight aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-muted-foreground rtl:-scale-x-100" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
