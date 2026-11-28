import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Search, Smartphone, Star, ToggleRight, X } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { BurgerObject, CarObject, ClinicObject, CupObject, ScissorsObject, ShoppingBagObject } from "@/components/brand/objects";
import { SatisSeal } from "@/components/brand/seal";
import { OutlinedPill, SliceHighlight } from "@/components/brand/slice";
import { SiteFooter } from "@/components/marketing/site-footer";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { pageAlternates } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { BUSINESS_TYPES } from "@/modules/organizations/schemas";
import { BrandAvatar } from "@/modules/score/components/brand-avatar";
import { ScoreHeader } from "@/modules/score/components/score-header";
import { ScorePill } from "@/modules/score/components/score-pill";
import { Stars } from "@/modules/score/components/stars";
import { MIN_RATINGS, oneDecimal } from "@/modules/score/definition";
import { getDirectory } from "@/modules/score/queries";
import type { BusinessType } from "@/types/database";

export async function generateMetadata({ params }: PageProps<"/[locale]/score">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "score" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: pageAlternates(locale, "/score") };
}

const WRAP = "mx-auto w-full max-w-[1240px] px-4 sm:px-6";

const TILES: { type: BusinessType; bg: string; Obj: (p: { className?: string }) => React.ReactNode }[] = [
  { type: "cafe", bg: "bg-zest", Obj: CupObject },
  { type: "restaurant", bg: "bg-ember", Obj: BurgerObject },
  { type: "retail", bg: "bg-mint", Obj: ShoppingBagObject },
  { type: "clinic", bg: "bg-ultramarine", Obj: ClinicObject },
  { type: "beauty", bg: "bg-ink", Obj: ScissorsObject },
  { type: "other", bg: "bg-ink-50", Obj: CarObject },
];

const QUICK: BusinessType[] = ["cafe", "restaurant", "retail", "clinic", "beauty"];
// The leaderboard cards sit slightly askew, like cards pinned to a board; straight on small screens.
const TILT = ["lg:-rotate-2", "lg:ms-10 lg:rotate-1", "lg:ms-4 lg:-rotate-1"];

export default async function ScoreDirectoryPage({ params, searchParams }: PageProps<"/[locale]/score">) {
  const locale = await resolveLocale(params);
  const sp = await searchParams;
  const query = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const type = typeof sp.type === "string" && (BUSINESS_TYPES as string[]).includes(sp.type) ? (sp.type as BusinessType) : null;
  const [t, types, directory] = await Promise.all([
    getTranslations({ locale, namespace: "score" }),
    getTranslations({ locale, namespace: "organization.businessTypes" }),
    getDirectory(query || null, type),
  ]);
  const results = directory?.results ?? [];
  const featured = !query && !type ? results.find((r) => r.score !== null) : undefined;
  const leaders = results.filter((r) => r.score !== null).slice(0, 3);
  const filtered = !!query || !!type;
  const listTitle = query ? t("directory.resultsTitle", { query }) : type ? types(type) : t("directory.topTitle");
  const meta = (r: (typeof results)[number]) =>
    [types(r.type), ...r.cities, t("ratings", { count: formatCount(locale, r.ratings) })].join(" · ");

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <ScoreHeader />
      <main id="content" className="flex-1">
        {/* Hero: a search-first band on Mint, with the brands customers rate highest right now */}
        <section className="relative overflow-hidden bg-mint text-ink">
          <div className={cn(WRAP, "relative grid gap-12 pt-12 pb-14 sm:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-center lg:gap-8 lg:pt-20 lg:pb-24")}>
            <div className="relative z-10 flex flex-col gap-6">
              <OutlinedPill className="self-start">
                <SatisSeal className="size-[22px]" />
                {t("directory.badge")}
              </OutlinedPill>
              <h1 className="text-[clamp(38px,5.5vw,64px)] leading-[1.4] font-bold">
                {t.rich("directory.title", { hl: (chunks) => <SliceHighlight tone="ink" className="mt-2 px-[0.25em] font-extrabold">{chunks}</SliceHighlight> })}
              </h1>
              <p className="max-w-[46ch] text-lg leading-[1.85]">{t("directory.body")}</p>
              <form action="" role="search" className="flex items-center gap-2 rounded-full border-[3px] border-ink bg-white p-1.5 ps-4 shadow-[6px_6px_0_var(--color-ink)] rtl:shadow-[-6px_6px_0_var(--color-ink)]">
                <Search aria-hidden strokeWidth={1.75} className="size-5 shrink-0 text-ink-500" />
                <label htmlFor="score-q" className="sr-only">
                  {t("directory.searchLabel")}
                </label>
                <input
                  id="score-q"
                  name="q"
                  type="search"
                  defaultValue={query}
                  maxLength={80}
                  placeholder={t("directory.searchPlaceholder")}
                  className="h-11 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-ink-400"
                />
                {type && <input type="hidden" name="type" value={type} />}
                <Button type="submit" className="h-11 shrink-0 rounded-full px-6">
                  {t("directory.search")}
                </Button>
              </form>
              <nav aria-label={t("directory.quick")}>
                <ul className="flex flex-wrap gap-2">
                  {QUICK.map((q) => (
                    <li key={q}>
                      <Link
                        href={`/score?type=${q}#top`}
                        className="inline-flex h-9 items-center rounded-full border-2 border-ink px-4 text-sm font-semibold outline-none transition-colors duration-[140ms] hover:bg-ink hover:text-white focus-visible:shadow-focus"
                      >
                        {types(q)}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              {directory && directory.ratings > 0 && (
                <p className="text-sm">
                  {t.rich("directory.stats", {
                    ratings: formatCount(locale, directory.ratings),
                    cities: formatCount(locale, Math.max(directory.cities, 1)),
                    b: (chunks) => <b className="font-display text-base font-extrabold tabular">{chunks}</b>,
                  })}
                </p>
              )}
            </div>

            <div className="relative lg:min-h-[480px]">
              {leaders.length > 0 ? (
                <div className="relative z-10 flex max-w-[440px] flex-col gap-4">
                  <p id="live-heading" className="text-sm font-bold">{t("directory.live")}</p>
                  <ol aria-labelledby="live-heading" className="flex flex-col gap-4">
                    {leaders.map((r, i) => (
                      <li key={r.slug} className={cn("transition-transform duration-[200ms] ease-[var(--ease-standard)]", TILT[i])}>
                        <Link
                          href={`/score/${r.slug}`}
                          className="flex items-center gap-4 rounded-[24px] border-[3px] border-ink bg-white p-4 shadow-[6px_6px_0_var(--color-ink)] outline-none transition-transform duration-[140ms] hover:-translate-y-0.5 focus-visible:shadow-focus active:translate-y-px rtl:shadow-[-6px_6px_0_var(--color-ink)]"
                        >
                          <span className="w-6 text-center font-display text-2xl font-extrabold tabular">{formatCount(locale, i + 1)}</span>
                          <BrandAvatar name={r.name} className="size-12 text-xl" />
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-[17px] font-bold">{r.name}</span>
                            <span className="truncate text-[13px] text-ink-500">{[types(r.type), ...r.cities.slice(0, 1)].join(" · ")}</span>
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="font-display text-2xl font-extrabold tabular">{oneDecimal(r.score!)}</span>
                            <Star aria-hidden strokeWidth={0} className="size-4 fill-zest" />
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ol>
                </div>
              ) : (
                <SatisSeal ring className="relative z-10 mx-auto size-40" />
              )}
            </div>
            <Image
              src="/characters/associate.png"
              alt=""
              aria-hidden
              width={1177}
              height={1337}
              priority
              sizes="380px"
              className="absolute -end-10 bottom-0 hidden h-auto w-[380px] drop-shadow-[18px_18px_0_var(--color-ink)] lg:block ltr:-scale-x-100"
            />
          </div>
        </section>

        {/* Categories */}
        <section id="categories" aria-labelledby="categories-heading" className={cn(WRAP, "flex scroll-mt-24 flex-col gap-8 pt-24")}>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="categories-heading" className="text-[clamp(28px,3.5vw,40px)] font-bold">
              {t("directory.categoriesTitle")}
            </h2>
            {filtered && (
              <Link href="/score#top" className="inline-flex items-center gap-1.5 rounded-xs text-[15px] font-semibold text-ultramarine outline-none hover:underline focus-visible:shadow-focus">
                {t("directory.clear")}
                <ArrowRight aria-hidden strokeWidth={1.75} className="size-4 rtl:-scale-x-100" />
              </Link>
            )}
          </div>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-5 lg:grid-cols-6">
            {TILES.map(({ type: tile, bg, Obj }) => {
              const active = tile === type;
              return (
                <li key={tile}>
                  <Link
                    href={`/score?type=${tile}#top`}
                    aria-current={active ? "true" : undefined}
                    className="group flex flex-col gap-3 rounded-[28px] outline-none focus-visible:shadow-focus"
                  >
                    <span
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-[28px] transition-transform duration-[200ms] ease-[var(--ease-standard)] motion-safe:group-hover:-translate-y-1.5",
                        bg,
                        active && "ring-4 ring-ink ring-offset-4",
                      )}
                    >
                      <Obj className="size-[62%]" />
                    </span>
                    <span className="flex flex-col">
                      <span className="text-[17px] font-bold">{types(tile)}</span>
                      <span className="text-[13px] text-ink-500">{t("directory.brands", { count: formatCount(locale, directory?.types[tile] ?? 0) })}</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Top rated / results */}
        <section id="top" aria-labelledby="top-heading" className={cn(WRAP, "grid scroll-mt-24 gap-8 pt-24 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]")}>
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="top-heading" className="text-[clamp(28px,3.5vw,40px)] font-bold">
                {listTitle}
              </h2>
              {filtered && (
                <Link href="/score#top" className="inline-flex items-center gap-1.5 rounded-full bg-ink-50 px-3.5 py-2 text-sm font-semibold outline-none hover:bg-ink-100 focus-visible:shadow-focus">
                  <X aria-hidden strokeWidth={1.75} className="size-4" />
                  {t("directory.clear")}
                </Link>
              )}
            </div>
            {results.length === 0 ? (
              <div className="flex flex-col gap-2 rounded-card bg-ink-50 px-6 py-10 text-center">
                <p className="text-lg font-bold">{filtered ? t("directory.emptyTitle") : t("directory.emptyAllTitle")}</p>
                <p className="text-ink-500">{filtered ? t("directory.emptyBody") : t("directory.emptyAllBody")}</p>
              </div>
            ) : (
              <ol aria-label={t("directory.listLabel")} className="flex flex-col divide-y divide-ink-100 border-y border-ink-100">
                {results.map((r, i) => (
                  <li key={r.slug}>
                    <Link
                      href={`/score/${r.slug}`}
                      className="flex items-center gap-4 rounded-control px-1 py-4 outline-none transition-colors hover:bg-ink-50 focus-visible:shadow-focus sm:px-3"
                    >
                      <span aria-hidden className="w-6 text-center font-display text-lg font-bold text-ink-400 tabular">
                        {formatCount(locale, i + 1)}
                      </span>
                      <BrandAvatar name={r.name} className="size-12 text-xl" />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[17px] font-bold">{r.name}</span>
                        <span className="truncate text-[13px] text-ink-500">{meta(r)}</span>
                      </span>
                      {r.score === null ? (
                        <span className="shrink-0 rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500">{t("collecting")}</span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-2.5">
                          <Stars value={r.score} size={14} className="hidden sm:inline-flex" />
                          <span className="font-display text-xl font-extrabold tabular">{oneDecimal(r.score)}</span>
                          <span className="sr-only">{t("starsLabel", { score: oneDecimal(r.score) })}</span>
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </div>
          {featured && featured.score !== null && (
            <Link
              href={`/score/${featured.slug}`}
              className="relative flex min-h-[420px] flex-col gap-3 overflow-hidden rounded-[28px] bg-ink p-8 text-white outline-none focus-visible:shadow-focus"
            >
              <span className="w-fit rounded-full bg-zest px-3 py-1 text-xs font-bold text-ink">{t("directory.featured")}</span>
              <span className="text-[28px] leading-snug font-bold">{featured.name}</span>
              <span className="max-w-[30ch] text-ink-200">{t("directory.featuredBody", { count: formatCount(locale, featured.ratings) })}</span>
              <span className="flex items-baseline gap-2">
                <span className="font-display text-7xl font-extrabold tracking-tight text-zest tabular">{oneDecimal(featured.score)}</span>
                <span className="text-ink-300">{t("outOf")}</span>
              </span>
              <Image
                src="/characters/man-thobe.png"
                alt=""
                width={1211}
                height={1299}
                sizes="260px"
                className="pointer-events-none absolute -bottom-6 -end-6 h-auto w-[260px] drop-shadow-[14px_14px_0_#FF6B4A]"
              />
            </Link>
          )}
        </section>

        {/* The seal */}
        <section id="seal" aria-labelledby="seal-heading" className="scroll-mt-24 px-3 pt-24 sm:px-6">
          <div className="mx-auto grid max-w-[1240px] items-center gap-10 overflow-hidden rounded-[32px] bg-ink px-6 pt-12 text-white sm:rounded-[40px] sm:px-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:pt-0">
            <div className="flex flex-col gap-6 lg:py-16">
              <h2 id="seal-heading" className="text-[clamp(32px,4vw,44px)] leading-[1.35] font-bold">
                {t("directory.seal.title")}
                <br />
                <span className="text-zest">{t("directory.seal.hl")}</span>
              </h2>
              <p className="max-w-[48ch] text-lg leading-[1.85] text-ink-200">{t("directory.seal.body")}</p>
              {featured && <ScorePill name={featured.name} score={featured.score} satisfied={featured.satisfied} className="w-fit" />}
              <dl className="grid grid-cols-3 gap-4 border-t border-ink-700 pt-6">
                {[
                  { value: `+${formatCount(locale, MIN_RATINGS)}`, label: t("directory.seal.min") },
                  { value: formatCount(locale, 60), label: t("directory.seal.refresh") },
                  { value: formatCount(locale, 0), label: t("directory.seal.edits") },
                ].map((s) => (
                  <div key={s.label} className="flex flex-col-reverse gap-1">
                    <dt className="text-[13px] text-ink-300">{s.label}</dt>
                    <dd className="font-display text-3xl font-extrabold text-zest tabular" dir="ltr">
                      {s.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
            <div aria-hidden className="relative min-h-[380px] self-stretch">
              <SatisSeal ring className="absolute end-0 top-10 size-[min(260px,55vw)]" />
              <Image
                src="/characters/yousef-wave.png"
                alt=""
                width={228}
                height={633}
                sizes="150px"
                className="absolute start-[12%] -bottom-4 h-[400px] w-auto drop-shadow-[14px_14px_0_#2B3AF3]"
              />
            </div>
          </div>
        </section>

        {/* How a rating gets here */}
        <section aria-labelledby="how-heading" className={cn(WRAP, "flex flex-col gap-10 pt-24")}>
          <h2 id="how-heading" className="text-[clamp(28px,3.5vw,40px)] font-bold">
            {t("directory.how.title")}
          </h2>
          <ol className="grid gap-10 md:grid-cols-3">
            {[
              { key: "invite", tone: "bg-mint text-ink", Icon: Smartphone },
              { key: "consent", tone: "bg-zest text-ink", Icon: ToggleRight },
              { key: "reply", tone: "bg-ink text-zest", Icon: null },
            ].map(({ key, tone, Icon }, i) => (
              <li key={key} className="flex flex-col gap-3">
                <span aria-hidden className={cn("flex size-20 items-center justify-center rounded-[22px]", tone)}>
                  {Icon ? <Icon strokeWidth={1.75} className="size-9" /> : <SatisSeal className="size-12" />}
                </span>
                <span aria-hidden className="pt-2 text-xs font-bold text-ink-400 tabular">
                  {`0${i + 1}`}
                </span>
                <h3 className="font-sans text-xl font-bold">{t(`directory.how.${key as "invite" | "consent" | "reply"}.title`)}</h3>
                <p className="leading-relaxed text-ink-500">{t(`directory.how.${key as "invite" | "consent" | "reply"}.body`)}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* For business */}
        <section className="px-3 pt-24 pb-24 sm:px-6">
          <div className="mx-auto grid max-w-[1240px] overflow-hidden rounded-[32px] bg-zest text-ink sm:rounded-[40px] md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
            <div className="flex flex-col justify-center gap-5 px-6 py-14 sm:p-16">
              <span className="text-sm font-bold">{t("directory.cta.eyebrow")}</span>
              <h2 className="text-[clamp(30px,4vw,44px)] leading-snug font-bold">{t("directory.cta.title")}</h2>
              <p className="max-w-[48ch] text-lg leading-[1.85]">{t("directory.cta.body")}</p>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="h-[52px] rounded-[12px] px-6 text-base">
                  <Link href="/signup">{t("directory.cta.primary")}</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-[52px] rounded-[12px] border-ink bg-white px-6 text-base hover:bg-ink-50">
                  <Link href="/book">{t("directory.cta.secondary")}</Link>
                </Button>
              </div>
            </div>
            <div aria-hidden className="relative min-h-[340px]">
              <div className="absolute start-1/2 -bottom-32 size-[360px] -translate-x-1/2 rounded-full bg-white rtl:translate-x-1/2" />
              <Image
                src="/characters/associate.png"
                alt=""
                width={1177}
                height={1337}
                sizes="320px"
                className="absolute start-1/2 -bottom-2 h-auto w-[320px] -translate-x-1/2 drop-shadow-[14px_14px_0_#F5B800] rtl:translate-x-1/2"
              />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
