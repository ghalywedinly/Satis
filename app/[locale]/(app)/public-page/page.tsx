import type { Metadata } from "next";
import { ExternalLink } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCount } from "@/lib/i18n/format";
import { Link, redirect } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { siteOrigin } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { BadgeCode } from "@/modules/score/components/badge-code";
import { ScorePill } from "@/modules/score/components/score-pill";
import { ScoreSettingsForm } from "@/modules/score/components/score-settings-form";
import { MIN_RATINGS, oneDecimal, suggestSlug } from "@/modules/score/definition";
import { getScoreSettings } from "@/modules/score/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/public-page">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "score.settings" });
  return { title: t("metaTitle") };
}

export default async function PublicPageSettings({ params }: PageProps<"/[locale]/public-page">) {
  const locale = await resolveLocale(params);
  const { membership } = await requireMembership(locale);
  if (!can(membership.role, "organization.edit")) redirect({ href: "/dashboard", locale });
  const org = membership.organization;
  const [t, data] = await Promise.all([getTranslations({ locale, namespace: "score.settings" }), getScoreSettings(org.id)]);
  const page = data.page;
  const slug = page?.public_slug ?? "";
  const origin = siteOrigin();
  const score = data.ratings >= MIN_RATINGS && data.average !== null ? Math.round(data.average * 10) / 10 : null;
  const live = !!page?.public_enabled && !!slug;

  const cards = [
    score !== null
      ? { label: t("cards.score"), value: oneDecimal(score), hint: t("cards.scoreHint"), tone: "text-ink-500" }
      : { label: t("cards.score"), value: t("cards.collecting", { min: formatCount(locale, MIN_RATINGS) }), hint: t("cards.collectingHint", { count: formatCount(locale, data.ratings) }), tone: "text-ink-500", small: true },
    { label: t("cards.satisfied"), value: formatCount(locale, data.satisfied), hint: t("cards.satisfiedHint", { count: formatCount(locale, data.ratings) }), tone: "text-ink-500" },
    { label: t("cards.published"), value: formatCount(locale, data.published), hint: "", tone: "text-ink-500" },
    { label: t("cards.waiting"), value: formatCount(locale, data.waiting), hint: t("cards.waitingHint"), tone: data.waiting > 0 ? "text-ember-700" : "text-ink-500" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold">{t("title")}</h1>
          <p className="text-ink-500">{t("subtitle")}</p>
        </div>
        {live && (
          <Button asChild variant="outline" className="border-ink">
            <Link href={`/score/${slug}`} target="_blank">
              {t("viewPage")}
              <ExternalLink aria-hidden strokeWidth={1.75} className="size-4" />
            </Link>
          </Button>
        )}
      </div>

      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <li key={c.label} className="flex flex-col gap-1 rounded-card border border-border bg-white p-5">
            <span className="text-sm text-ink-500">{c.label}</span>
            <span className={cn("font-display font-extrabold tabular", c.small ? "pt-1 text-lg" : "text-3xl")}>{c.value}</span>
            {c.hint && <span className={cn("text-[13px]", c.tone)}>{c.hint}</span>}
          </li>
        ))}
      </ul>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <h2 className="text-xl font-bold">{t("page.title")}</h2>
          <ScoreSettingsForm
            origin={origin}
            page={{
              enabled: !!page?.public_enabled,
              reviewsEnabled: page?.public_reviews_enabled ?? true,
              slug: slug || suggestSlug(org.name),
              about: page?.public_about ?? "",
              website: page?.public_website ?? "",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">{t("badge.title")}</h2>
            <p className="text-sm text-ink-500">{live ? t("badge.body") : t("badge.off")}</p>
          </div>
          {live && (
            <BadgeCode
              origin={origin}
              slug={slug}
              preview={{
                full: <ScorePill name={org.name} score={score} satisfied={data.satisfied} />,
                small: <ScorePill name={org.name} score={score} satisfied={data.satisfied} size="small" />,
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
