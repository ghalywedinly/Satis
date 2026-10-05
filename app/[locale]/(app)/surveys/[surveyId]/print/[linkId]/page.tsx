import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SatisLogo } from "@/components/brand/satis-mark";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PrintButton } from "@/modules/surveys/components/print-button";
import { surveyUrl } from "@/modules/surveys/links";

export async function generateMetadata({ params }: PageProps<"/[locale]/surveys/[surveyId]/print/[linkId]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "surveys.print" });
  return { title: t("metaTitle") };
}

/** A printable table card (A6). The card is bilingual whatever the dashboard language. */
export default async function PrintQrPage({ params }: PageProps<"/[locale]/surveys/[surveyId]/print/[linkId]">) {
  const locale = await resolveLocale(params);
  const { surveyId, linkId } = await params;
  const { membership } = await requireMembership(locale);
  if (!/^[0-9a-f-]{36}$/i.test(linkId)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: link } = await supabase
    .from("survey_links")
    .select("public_code, location:locations(name)")
    .eq("id", linkId)
    .eq("survey_id", surveyId)
    .eq("organization_id", membership.organization.id)
    .maybeSingle();
  if (!link) notFound();

  const [t, ar, en] = await Promise.all([
    getTranslations({ locale, namespace: "surveys.print" }),
    getTranslations({ locale: "ar", namespace: "surveys.print" }),
    getTranslations({ locale: "en", namespace: "surveys.print" }),
  ]);
  const url = surveyUrl(link.public_code);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2 self-stretch print:hidden">
        <Button asChild variant="ghost">
          <Link href={`/surveys/${surveyId}/share`}>{t("back")}</Link>
        </Button>
        <PrintButton label={t("printNow")} />
      </div>
      <article className="flex aspect-[105/148] w-full max-w-[420px] flex-col items-center justify-between rounded-card border border-border bg-white p-8 text-center print:max-w-none print:rounded-none print:border-0">
        <div className="flex flex-col items-center gap-1">
          <span className="font-display text-2xl font-extrabold">{membership.organization.name}</span>
          {link.location && <span className="text-sm text-muted-foreground">{link.location.name}</span>}
        </div>
        <div className="flex flex-col items-center gap-2">
          <p lang="ar" dir="rtl" className="text-xl font-bold">
            {ar("scan")}
          </p>
          <p lang="en" dir="ltr" className="font-display text-lg font-bold">
            {en("scan")}
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated SVG from our own API */}
        <img src={`/api/qr/${link.public_code}?format=svg`} alt="" className="aspect-square w-3/4" />
        <div className="flex flex-col items-center gap-2">
          <bdi dir="ltr" className="text-xs text-muted-foreground">
            {url}
          </bdi>
          <span className="text-xs text-muted-foreground">
            <span lang="ar">{ar("time")}</span>
            {" · "}
            <span lang="en">{en("time")}</span>
          </span>
          <SatisLogo size={14} tone="ink-ultra" />
        </div>
      </article>
    </div>
  );
}
