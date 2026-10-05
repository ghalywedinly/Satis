import type { Metadata } from "next";
import { Download, Printer } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/i18n/format";
import { Link, redirect } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingProgress, ONBOARDING_STEPS } from "@/modules/organizations/components/onboarding-progress";
import { surveyUrl } from "@/modules/surveys/links";

export async function generateMetadata({ params }: PageProps<"/[locale]/onboarding/qr">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "onboarding" });
  return { title: t("qr.title") };
}

/** Onboarding step 6: the first location's QR code, ready to download or print. */
export default async function OnboardingQrPage({ params, searchParams }: PageProps<"/[locale]/onboarding/qr">) {
  const locale = await resolveLocale(params);
  const { membership } = await requireMembership(locale);
  const { survey } = await searchParams;
  const t = await getTranslations({ locale, namespace: "onboarding" });
  const ts = await getTranslations({ locale, namespace: "surveys.share" });

  const supabase = await createSupabaseServerClient();
  const { data: link } =
    typeof survey === "string" && /^[0-9a-f-]{36}$/i.test(survey)
      ? await supabase
          .from("survey_links")
          .select("id, public_code, location:locations(name)")
          .eq("survey_id", survey)
          .eq("organization_id", membership.organization.id)
          .order("created_at")
          .limit(1)
          .maybeSingle()
      : { data: null };
  if (!link) return redirect({ href: "/dashboard", locale });

  return (
    <div className="flex flex-col gap-8">
      <OnboardingProgress current={6} label={t("progress", { current: formatCount(locale, 6), total: formatCount(locale, ONBOARDING_STEPS) })} />
      <div className="flex flex-col gap-2">
        <h1 className="text-[32px] leading-tight font-extrabold sm:text-4xl">{t("qr.title")}</h1>
        <p className="text-muted-foreground">{t("qr.body", { location: link.location?.name ?? "" })}</p>
      </div>
      <div className="flex flex-col items-center gap-4 rounded-card border border-border bg-white p-6">
        {/* eslint-disable-next-line @next/next/no-img-element -- authenticated SVG from our own API */}
        <img src={`/api/qr/${link.public_code}?format=svg`} alt="" width={220} height={220} className="size-[220px]" />
        <bdi dir="ltr" className="text-sm text-muted-foreground">
          {surveyUrl(link.public_code)}
        </bdi>
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={`/api/qr/${link.public_code}?format=png&download=1`} download>
              <Download aria-hidden strokeWidth={1.75} />
              {ts("downloadPng")}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href={`/api/qr/${link.public_code}?format=svg&download=1`} download>
              <Download aria-hidden strokeWidth={1.75} />
              {ts("downloadSvg")}
            </a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/surveys/${survey}/print/${link.id}`}>
              <Printer aria-hidden strokeWidth={1.75} />
              {ts("print")}
            </Link>
          </Button>
        </div>
      </div>
      <Button asChild size="lg" className="self-end">
        <Link href="/onboarding/done">{t("qr.next")}</Link>
      </Button>
    </div>
  );
}
