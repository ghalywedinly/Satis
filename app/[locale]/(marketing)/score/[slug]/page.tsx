import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { BadgeCheck, ExternalLink, Star, TrendingDown, TrendingUp } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SatisSeal } from "@/components/brand/seal";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { formatCount, formatPercent } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { pageAlternates } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { BrandAvatar } from "@/modules/score/components/brand-avatar";
import { ReviewCard } from "@/modules/score/components/review-card";
import { ScoreHeader } from "@/modules/score/components/score-header";
import { Stars } from "@/modules/score/components/stars";
import { YearChart } from "@/modules/score/components/year-chart";
import { oneDecimal, SLUG_PATTERN } from "@/modules/score/definition";
import { getProfile, getReviews } from "@/modules/score/queries";

const PAGE = 10;
const MAX = 60;
// Stars from five to one: Mint for happy, Zest neutral, Ember unhappy.
const STAR_TONES = ["bg-ember-700", "bg-ember", "bg-zest", "bg-mint-600", "bg-mint"];

type Props = PageProps<"/[locale]/score/[slug]">;

async function load(params: Props["params"]) {
  const { slug } = await params;
  if (!SLUG_PATTERN.test(slug) || slug.length > 40) return null;
  const profile = await getProfile(slug);
  return profile ? { slug, profile } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "score" });
  const found = await load(params);
  if (!found) return { title: t("profile.notFoundTitle"), robots: { index: false } };
  const { slug, profile } = found;
  return {
    title: `${profile.name} · ${t("brand")}`,
    description:
      profile.score !== null
        ? t("profile.scoreSummary", { name: profile.name, score: oneDecimal(profile.score), count: formatCount(locale, profile.ratings) })
        : profile.about ?? t("profile.fallbackAbout", { name: profile.name }),
    alternates: pageAlternates(locale, `/score/${slug}`),
  };
}

export default async function ScoreProfilePage({ params, searchParams }: Props) {
  const locale = await resolveLocale(params);
  const found = await load(params);
  if (!found) notFound();
  const { slug, profile } = found;
  const sp = await searchParams;
  const stars = typeof sp.stars === "string" && /^[1-5]$/.test(sp.stars) ? Number(sp.stars) : null;
  const shown = Math.min(MAX, Math.max(PAGE, typeof sp.n === "string" && /^\d+$/.test(sp.n) ? Number(sp.n) : PAGE));
  const [t, types, reviews] = await Promise.all([
    getTranslations({ locale, namespace: "score" }),
    getTranslations({ locale, namespace: "organization.businessTypes" }),
    getReviews(slug, stars, shown),
  ]);

  const { score, ratings, satisfied, distribution } = profile;
  const cities = [...new Set(profile.locations.map((l) => l.city).filter((c): c is string => !!c))];
  const scored = profile.months.filter((m) => m.score !== null);
  const change = scored.length >= 2 ? Number(scored[scored.length - 1].score) - Number(scored[0].score) : null;
  const maxStars = Math.max(...distribution, 1);
  const reviewHref = (s: number | null, n?: number) => {
    const q = new URLSearchParams();
    if (s) q.set("stars", String(s));
    if (n) q.set("n", String(n));
    const qs = q.toString();
    return `/score/${slug}${qs ? `?${qs}` : ""}#reviews`;
  };
  const meta = [
    types(profile.type),
    profile.locations.length === 1 ? t("profile.oneBranch") : t("profile.branches", { count: formatCount(locale, profile.locations.length) }),
    ...cities.slice(0, 2),
    t("profile.since", { year: String(profile.since) }),
  ];
  const stats = [
    ratings > 0 && { value: formatPercent(locale, satisfied / ratings, 0), label: t("profile.stats.satisfied"), tone: "bg-mint" },
    profile.lowReviews > 0 && { value: formatPercent(locale, profile.lowAnswered / profile.lowReviews, 0), label: t("profile.stats.answered"), tone: "bg-ultramarine" },
    { value: formatCount(locale, profile.reviews), label: t("profile.stats.reviews"), tone: "bg-ember" },
  ].filter((s): s is { value: string; label: string; tone: string } => !!s);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <ScoreHeader />
      <main id="content" className="flex-1">
        <div className="mx-auto w-full max-w-[1240px] px-4 pt-8 sm:px-6">
          <nav aria-label={t("nav.label")} className="text-sm text-ink-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/score" className="rounded-xs outline-none hover:text-ink focus-visible:shadow-focus">
                  {t("brand")}
                </Link>
              </li>
              <li aria-hidden>{"/"}</li>
              <li>
                <Link href={`/score?type=${profile.type}#top`} className="rounded-xs outline-none hover:text-ink focus-visible:shadow-focus">
                  {types(profile.type)}
                </Link>
              </li>
              <li aria-hidden>{"/"}</li>
              <li aria-current="page" className="text-ink">
                {profile.name}
              </li>
            </ol>
          </nav>

          {/* Brand and score */}
          <div className="grid gap-8 pt-6 pb-12 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:items-start">
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center gap-5">
                <span className="relative">
                  <BrandAvatar name={profile.name} className="size-24 rounded-[24px] text-5xl drop-shadow-[8px_8px_0_#0B0D12] rtl:drop-shadow-[-8px_8px_0_#0B0D12]" />
                  <SatisSeal className="absolute -end-3 -bottom-3 size-11" />
                </span>
                <div className="flex min-w-0 flex-col gap-2">
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-mint-50 px-2.5 py-1 text-xs font-semibold text-mint-700">
                    <BadgeCheck aria-hidden strokeWidth={1.75} className="size-3.5" />
                    {t("profile.official")}
                  </span>
                  <h1 className="text-[clamp(34px,5vw,52px)] leading-tight font-bold">{profile.name}</h1>
                </div>
              </div>
              <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[15px] text-ink-500">
                {meta.map((m, i) => (
                  <span key={m} className="inline-flex items-center gap-2">
                    {i > 0 && <span aria-hidden>{"·"}</span>}
                    {m}
                  </span>
                ))}
                {profile.website && (
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden>{"·"}</span>
                    <a href={`https://${profile.website}`} rel="nofollow noopener" target="_blank" className="rounded-xs font-semibold text-ultramarine outline-none hover:underline focus-visible:shadow-focus">
                      <bdi dir="ltr">{profile.website}</bdi>
                    </a>
                  </span>
                )}
              </p>
              <p dir="auto" className="max-w-[60ch] text-start text-lg leading-[1.85]">
                {profile.about ?? t("profile.fallbackAbout", { name: profile.name })}
              </p>
              <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stats.map((s) => (
                  <li key={s.label} className="flex flex-col gap-1 rounded-card border border-ink-100 p-4">
                    <span aria-hidden className={cn("h-1 w-7 rounded-full", s.tone)} />
                    <span className="pt-2 font-display text-2xl font-extrabold tabular">{s.value}</span>
                    <span className="text-[13px] leading-snug text-ink-500">{s.label}</span>
                  </li>
                ))}
              </ul>
              {profile.website && (
                <Button asChild size="lg" className="h-12 w-fit rounded-[12px] px-6 text-[15px]">
                  <a href={`https://${profile.website}`} rel="nofollow noopener" target="_blank">
                    {t("profile.website")}
                    <ExternalLink aria-hidden strokeWidth={1.75} className="size-4" />
                  </a>
                </Button>
              )}
            </div>

            <section aria-labelledby="score-heading" className="flex flex-col gap-5 rounded-[28px] bg-ink p-6 text-white sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 id="score-heading" className="font-sans text-lg font-bold">
                  {t("profile.scoreTitle")}
                </h2>
                <span className="text-[13px] text-ink-300">{t("profile.window")}</span>
              </div>
              {score !== null ? (
                <>
                  <p className="sr-only">{t("profile.scoreSummary", { name: profile.name, score: oneDecimal(score), count: formatCount(locale, ratings) })}</p>
                  <div aria-hidden className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <span className="flex items-baseline gap-2">
                        <span className="font-display text-[88px] leading-none font-extrabold tracking-tighter tabular">{oneDecimal(score)}</span>
                        <span className="text-ink-300">{t("outOf")}</span>
                      </span>
                      <Stars value={score} size={24} onInk />
                    </div>
                    <SatisSeal ring className="size-28 sm:size-32" />
                  </div>
                  <div aria-hidden className="flex h-3 gap-1 overflow-hidden rounded-full" dir="ltr">
                    {[...distribution].reverse().map((n, i) =>
                      n > 0 ? <span key={i} className={cn("h-full first:rounded-s-full last:rounded-e-full", STAR_TONES[4 - i])} style={{ flexGrow: n }} /> : null,
                    )}
                  </div>
                  <p className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-300">
                    <span>{t.rich("profile.satisfied", { count: formatCount(locale, satisfied), b: (c) => <b className="font-display text-base font-extrabold text-white tabular">{c}</b> })}</span>
                    <span>{t("profile.from", { count: formatCount(locale, ratings) })}</span>
                  </p>
                  {change !== null && Math.abs(change) >= 0.05 && (
                    <p className="flex items-center gap-2 border-t border-ink-700 pt-4 text-sm text-ink-300">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-ink tabular", change > 0 ? "bg-mint" : "bg-ember")}>
                        {change > 0 ? <TrendingUp aria-hidden strokeWidth={2} className="size-3.5" /> : <TrendingDown aria-hidden strokeWidth={2} className="size-3.5" />}
                        <bdi dir="ltr">{`${change > 0 ? "+" : "−"}${oneDecimal(Math.abs(change))}`}</bdi>
                      </span>
                      {t("profile.change")}
                    </p>
                  )}
                </>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <SatisSeal className="size-16 opacity-40" />
                    <p className="text-2xl font-bold">{t("collecting")}</p>
                  </div>
                  <p className="text-ink-200">{t("profile.collectingBody", { min: formatCount(locale, profile.minRatings), count: formatCount(locale, ratings) })}</p>
                  <div
                    role="progressbar"
                    aria-label={t("collecting")}
                    aria-valuemin={0}
                    aria-valuemax={profile.minRatings}
                    aria-valuenow={ratings}
                    className="h-2.5 overflow-hidden rounded-full bg-ink-700"
                  >
                    <span className="block h-full rounded-full bg-zest" style={{ width: `${Math.round((ratings / profile.minRatings) * 100)}%` }} />
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        {/* Numbers */}
        <div className="bg-ink-50 py-12">
          <div className="mx-auto grid w-full max-w-[1240px] gap-5 px-4 sm:px-6 lg:grid-cols-3">
            <section aria-labelledby="dist-heading" className="flex flex-col gap-4 rounded-card border border-ink-100 bg-white p-6">
              <h2 id="dist-heading" className="font-sans text-lg font-bold">
                {t("profile.distribution")}
              </h2>
              <ul className="flex flex-col gap-2.5">
                {[5, 4, 3, 2, 1].map((s) => (
                  <li key={s} className="flex items-center gap-3 text-sm">
                    <span className="sr-only">{t("profile.starRow", { stars: String(s), count: formatCount(locale, distribution[s - 1]) })}</span>
                    <span aria-hidden className="w-3 font-bold tabular">
                      {s}
                    </span>
                    <Star aria-hidden strokeWidth={0} className="size-3 fill-zest" />
                    <span aria-hidden className="h-2 flex-1 overflow-hidden rounded-full bg-ink-50">
                      <span className={cn("block h-full rounded-full", STAR_TONES[s - 1])} style={{ width: `${(distribution[s - 1] / maxStars) * 100}%` }} />
                    </span>
                    <span aria-hidden className="w-12 text-end text-ink-500 tabular">
                      {formatCount(locale, distribution[s - 1])}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-labelledby="year-heading" className="flex flex-col gap-4 rounded-card border border-ink-100 bg-white p-6">
              <h2 id="year-heading" className="font-sans text-lg font-bold">
                {t("profile.year")}
              </h2>
              <YearChart months={profile.months} />
            </section>
            <section aria-labelledby="branches-heading" className="flex flex-col gap-4 rounded-card border border-ink-100 bg-white p-6">
              <h2 id="branches-heading" className="font-sans text-lg font-bold">
                {t("profile.branchesTitle")}
              </h2>
              <ul className="flex flex-col divide-y divide-ink-100">
                {profile.locations.map((l) => (
                  <li key={`${l.name}-${l.city}`} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-semibold">{l.name}</span>
                      {l.city && <span className="truncate text-xs text-ink-500">{l.city}</span>}
                    </span>
                    {l.score !== null ? (
                      <>
                        <span className="sr-only">{t("profile.branchScore", { score: oneDecimal(l.score), count: formatCount(locale, l.ratings) })}</span>
                        <span aria-hidden className="text-xs text-ink-500 tabular">
                          {formatCount(locale, l.ratings)}
                        </span>
                        <span aria-hidden className="w-10 text-end font-display text-base font-extrabold tabular">
                          {oneDecimal(l.score)}
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-ink-500">{t("profile.branchFew")}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {/* Reviews */}
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section id="reviews" aria-labelledby="reviews-heading" className="flex min-w-0 scroll-mt-24 flex-col gap-5">
            <h2 id="reviews-heading" className="text-[clamp(26px,3vw,34px)] font-bold">
              {t("profile.reviewsCount", { count: formatCount(locale, profile.reviews) })}
            </h2>
            <nav aria-label={t("profile.filterLabel")}>
              <ul className="flex flex-wrap gap-2">
                {[null, 5, 4, 3, 2, 1].map((s) => {
                  const on = s === stars;
                  return (
                    <li key={s ?? "all"}>
                      <Link
                        href={reviewHref(s)}
                        aria-current={on ? "true" : undefined}
                        scroll={false}
                        className={cn(
                          "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold outline-none transition-colors focus-visible:shadow-focus",
                          on ? "border-ink bg-ink text-white" : "border-ink-100 bg-white hover:bg-ink-50",
                        )}
                      >
                        {s === null ? t("profile.all") : t("profile.stars", { n: String(s) })}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            {reviews.items.length === 0 ? (
              <div className="flex flex-col gap-2 rounded-card bg-ink-50 px-6 py-10 text-center">
                <p className="text-lg font-bold">{stars ? t("profile.noFilteredTitle") : t("profile.noReviewsTitle")}</p>
                {!stars && <p className="text-ink-500">{t("profile.noReviewsBody")}</p>}
              </div>
            ) : (
              <>
                <p className="text-sm text-ink-500">{t("profile.showing", { shown: formatCount(locale, reviews.items.length), total: formatCount(locale, reviews.total) })}</p>
                <div className="flex flex-col gap-4">
                  {reviews.items.map((r) => (
                    <ReviewCard key={r.id} review={r} brand={profile.name} />
                  ))}
                </div>
                {reviews.items.length < reviews.total && shown < MAX && (
                  <Button asChild variant="outline" size="lg" className="h-12 self-center rounded-[12px] border-ink px-6">
                    <Link href={reviewHref(stars, shown + PAGE)} scroll={false}>
                      {t("profile.more")}
                    </Link>
                  </Button>
                )}
              </>
            )}
          </section>

          <aside className="flex flex-col gap-5">
            <section aria-labelledby="how-heading" className="relative flex flex-col gap-4 overflow-hidden rounded-[24px] bg-ink p-6 text-white">
              <SatisSeal className="absolute -end-5 -top-5 size-24" />
              <h2 id="how-heading" className="max-w-[16ch] font-sans text-lg font-bold">
                {t("profile.how.title")}
              </h2>
              <ol className="flex flex-col gap-3 text-sm leading-relaxed text-ink-200">
                {(["invite", "consent", "reply"] as const).map((k, i) => (
                  <li key={k} className="flex gap-3">
                    <span aria-hidden className="font-bold text-zest tabular">{`0${i + 1}`}</span>
                    {t(`profile.how.${k}`)}
                  </li>
                ))}
              </ol>
            </section>
            <section aria-labelledby="rate-heading" className="relative flex min-h-[220px] flex-col gap-2 overflow-hidden rounded-[24px] bg-mint p-6 pe-32 text-ink">
              <h2 id="rate-heading" className="font-sans text-lg font-bold">
                {t("profile.rate.title", { name: profile.name })}
              </h2>
              <p className="text-sm leading-relaxed">{t("profile.rate.body")}</p>
              <Image
                src="/characters/yousef-phone.png"
                alt=""
                width={216}
                height={632}
                sizes="90px"
                className="pointer-events-none absolute -bottom-24 end-4 h-[300px] w-auto"
              />
            </section>
            <section aria-labelledby="owner-heading" className="flex flex-col items-start gap-3 rounded-[24px] bg-ultramarine p-6 text-white">
              <h2 id="owner-heading" className="font-sans text-lg font-bold">
                {t("profile.owner.title", { name: profile.name })}
              </h2>
              <p className="text-sm leading-relaxed text-ultra-100">{t("profile.owner.body")}</p>
              <Button asChild variant="outline" className="h-10 border-white bg-white text-ink hover:bg-ultra-50">
                <Link href="/public-page">{t("profile.owner.cta")}</Link>
              </Button>
            </section>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
