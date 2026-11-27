import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { formatCount } from "@/lib/i18n/format";
import type { Locale } from "@/lib/i18n/routing";
import { siteUrl } from "@/lib/seo";
import { oneDecimal, SLUG_PATTERN } from "@/modules/score/definition";
import { getBadge } from "@/modules/score/queries";

// Read by public/badge.js on brands' websites: any origin, cached for an hour at the edge.
const HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600",
};

/** The website badge's content, already translated and formatted. */
export async function GET(request: Request, { params }: RouteContext<"/api/score/[slug]">) {
  const { slug } = await params;
  const lang = new URL(request.url).searchParams.get("lang");
  const locale: Locale = lang === "en" ? "en" : "ar";
  if (!SLUG_PATTERN.test(slug) || slug.length > 40) return NextResponse.json({ error: "not_found" }, { status: 404, headers: HEADERS });

  const badge = await getBadge(slug);
  if (!badge) return NextResponse.json({ error: "not_found" }, { status: 404, headers: HEADERS });

  const t = await getTranslations({ locale, namespace: "score" });
  const score = badge.score === null ? null : oneDecimal(badge.score);
  return NextResponse.json(
    {
      lang: locale,
      url: siteUrl(locale, `/score/${slug}`),
      score,
      stars: badge.score,
      satisfied: t("badge.satisfied", { count: formatCount(locale, badge.satisfied) }),
      verified: t("badge.verified"),
      collecting: t("collecting"),
      label: score === null ? t("badge.collectingLabel", { name: badge.name }) : t("badge.label", { name: badge.name, score }),
    },
    { headers: HEADERS },
  );
}
