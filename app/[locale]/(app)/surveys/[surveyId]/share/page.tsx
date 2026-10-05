import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { CreateMissingLinks } from "@/modules/surveys/components/create-missing-links";
import { ShareCard } from "@/modules/surveys/components/share-card";
import { SurveyHeader } from "@/modules/surveys/components/survey-header";
import { surveyUrl } from "@/modules/surveys/links";
import { getSurvey } from "@/modules/surveys/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/surveys/[surveyId]/share">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "surveys.share" });
  return { title: t("title") };
}

export default async function SurveySharePage({ params }: PageProps<"/[locale]/surveys/[surveyId]/share">) {
  const locale = await resolveLocale(params);
  const { surveyId } = await params;
  const { membership } = await requireMembership(locale);
  const survey = await getSurvey(membership.organization.id, surveyId);
  if (!survey) notFound();
  const t = await getTranslations({ locale, namespace: "surveys.share" });
  const canManage = can(membership.role, "surveys.manage");

  const supabase = await createSupabaseServerClient();
  const [{ data: links }, { data: locations }] = await Promise.all([
    supabase.from("survey_links").select("id, public_code, is_active, location:locations(id, name, archived_at)").eq("survey_id", survey.id),
    supabase.from("locations").select("id, name").eq("organization_id", membership.organization.id).is("archived_at", null).order("name"),
  ]);
  const visible = (links ?? []).filter((l) => l.location && !l.location.archived_at);
  const linked = new Set(visible.map((l) => l.location!.id));
  const missing = (locations ?? []).filter((l) => !linked.has(l.id));

  return (
    <div className="flex flex-col gap-6">
      <SurveyHeader locale={locale} survey={survey} active="share" canManage={canManage} />
      {survey.current_version_id === null ? (
        <p className="text-muted-foreground">{t("notPublished")}</p>
      ) : (
        <>
          <p className="max-w-2xl text-muted-foreground">{t("subtitle")}</p>
          <ul className="flex flex-col gap-4">
            {visible
              .sort((a, b) => a.location!.name.localeCompare(b.location!.name))
              .map((link) => (
                <ShareCard
                  key={link.id}
                  surveyId={survey.id}
                  canManage={canManage}
                  link={{ id: link.id, code: link.public_code, url: surveyUrl(link.public_code), locationName: link.location!.name, isActive: link.is_active }}
                />
              ))}
          </ul>
          {missing.length > 0 && canManage && (
            <section className="flex flex-col items-start gap-3 rounded-card border border-dashed border-ink-200 p-5">
              <h2 className="font-sans text-base font-semibold">{t("missingTitle")}</h2>
              <p className="text-sm text-muted-foreground">{missing.map((l) => l.name).join(" · ")}</p>
              <CreateMissingLinks surveyId={survey.id} />
            </section>
          )}
        </>
      )}
    </div>
  );
}
