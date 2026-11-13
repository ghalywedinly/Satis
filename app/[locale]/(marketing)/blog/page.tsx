import type { Metadata } from "next";
import { Search } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { SliceHighlight } from "@/components/brand/slice";
import { SiteFooter } from "@/components/marketing/sections";
import { SiteHeader } from "@/components/marketing/site-header";
import { Button } from "@/components/ui/button";
import { formatCount } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { pageAlternates } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { allPosts, BLOG_CATEGORIES, findPosts, isBlogCategory } from "@/modules/blog";
import { ArticleCta } from "@/modules/blog/components/article-body";
import { PostCover } from "@/modules/blog/components/cover";
import { PostCard } from "@/modules/blog/components/post-card";
import { PostDate, PostKicker } from "@/modules/blog/components/post-meta";

export async function generateMetadata({ params }: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: pageAlternates(locale, "/blog"),
    openGraph: { type: "website", title: t("metaTitle"), description: t("metaDescription") },
  };
}

export default async function BlogPage({ params, searchParams }: PageProps<"/[locale]/blog">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "blog" });
  const sp = await searchParams;
  const category = isBlogCategory(sp.category) ? sp.category : undefined;
  const query = typeof sp.q === "string" ? sp.q.slice(0, 100).trim() : "";
  const filtering = Boolean(category || query);

  const posts = findPosts(locale, { category, query });
  // The newest post leads the unfiltered page; a filtered page is a plain list of results.
  const [featured, ...rest] = filtering ? [undefined, ...posts] : posts;

  const chips = [{ key: "all", href: "/blog", label: t("all"), active: !category }].concat(
    BLOG_CATEGORIES.filter((c) => allPosts().some((p) => p.category === c)).map((c) => ({ key: c, href: `/blog?category=${c}`, label: t(`categories.${c}`), active: category === c })),
  );

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <SiteHeader />
      <main id="content" className="flex-1">
        <section className="mx-auto flex w-full max-w-[1216px] flex-wrap items-end gap-8 px-4 pt-12 pb-7 sm:px-6 sm:pt-16">
          <div className="flex min-w-0 flex-[999_1_480px] flex-col gap-4">
            <span className="eyebrow text-ultramarine">{t("eyebrow")}</span>
            <h1 className="max-w-[18ch] text-[clamp(34px,4.6vw,56px)] leading-[1.12] font-extrabold tracking-[-0.03em] text-ink">
              {t.rich("title", { hl: (chunks) => <SliceHighlight tone="ink" className="mt-1 px-[0.25em] font-extrabold">{chunks}</SliceHighlight> })}
            </h1>
            <p className="max-w-[56ch] text-base leading-relaxed text-ink-600 sm:text-lg">{t("intro")}</p>
          </div>
          <form role="search" action={locale === "ar" ? "/blog" : "/en/blog"} className="flex flex-[1_1_320px] flex-col gap-2">
            <label htmlFor="blog-q" className="text-sm font-semibold text-ink">
              {t("searchLabel")}
            </label>
            {category ? <input type="hidden" name="category" value={category} /> : null}
            <div className="flex gap-2">
              <div className="flex h-12 flex-1 items-center gap-2.5 rounded-control border border-input bg-white px-3.5 focus-within:shadow-focus">
                <Search aria-hidden strokeWidth={1.75} className="size-5 shrink-0 text-ink-500" />
                <input
                  id="blog-q"
                  name="q"
                  type="search"
                  defaultValue={query}
                  maxLength={100}
                  placeholder={t("searchPlaceholder")}
                  className="h-full min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-400"
                />
              </div>
              <Button type="submit" variant="outline" className="h-12 px-4">
                {t("searchSubmit")}
              </Button>
            </div>
          </form>
        </section>

        <nav aria-label={t("categoriesLabel")} className="mx-auto flex w-full max-w-[1216px] flex-wrap gap-2 px-4 pb-8 sm:px-6">
          {chips.map((chip) => (
            <Link
              key={chip.key}
              href={chip.href}
              aria-current={chip.active ? "page" : undefined}
              className={cn(
                "inline-flex h-10 items-center rounded-full border px-4 text-sm font-semibold outline-none transition-colors duration-[140ms] focus-visible:shadow-focus",
                chip.active ? "border-ink bg-ink text-sand" : "border-input bg-white text-ink hover:border-ink-300",
              )}
            >
              {chip.label}
            </Link>
          ))}
        </nav>

        {featured ? (
          <section aria-label={t("featured")} className="mx-auto w-full max-w-[1216px] px-4 pb-14 sm:px-6">
            <Link
              href={`/blog/${featured.slug}`}
              className="group flex flex-wrap overflow-hidden rounded-card border border-border bg-white outline-none transition-[border-color] duration-[140ms] hover:border-ink-300 focus-visible:shadow-focus"
            >
              <PostCover post={featured} locale={locale} large className="min-h-[240px] flex-[1_1_480px] sm:min-h-[360px]" />
              <div className="flex flex-[1_1_380px] flex-col justify-center gap-4 p-6 sm:p-10">
                <PostKicker post={featured} locale={locale} />
                <h2 className="text-[clamp(24px,2.6vw,34px)] leading-snug font-bold text-ink group-hover:text-ultramarine">{featured.content[locale].title}</h2>
                <p className="text-base leading-relaxed text-ink-600 sm:text-[17px]">{featured.content[locale].excerpt}</p>
                <div className="flex items-center gap-2.5 pt-1 text-sm">
                  <span aria-hidden className="flex size-9 items-center justify-center rounded-full bg-ultra-50 font-bold text-ultramarine">
                    {t("authorInitial")}
                  </span>
                  <span className="font-semibold text-ink">{t("author")}</span>
                  <span aria-hidden className="text-ink-300">
                    {"·"}
                  </span>
                  <PostDate post={featured} locale={locale} className="text-ink-500" />
                </div>
              </div>
            </Link>
          </section>
        ) : null}

        <section aria-labelledby="blog-list" className="mx-auto flex w-full max-w-[1216px] flex-col gap-6 px-4 pb-16 sm:px-6">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 id="blog-list" className="text-2xl font-bold text-ink sm:text-[28px]">
              {filtering ? (category && !query ? t(`categories.${category}`) : t("searchLabel")) : t("latest")}
            </h2>
            {filtering ? <span className="text-sm text-ink-500">{t("results", { count: formatCount(locale, posts.length) })}</span> : null}
          </div>
          {posts.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-card border border-border bg-white p-8">
              <p className="text-lg font-bold text-ink">{t("empty.title")}</p>
              <p className="text-ink-600">{t("empty.body")}</p>
              <Button asChild variant="outline">
                <Link href="/blog">{t("empty.action")}</Link>
              </Button>
            </div>
          ) : rest.length > 0 ? (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6">
              {rest.map((post) => post && <PostCard key={post.slug} post={post} locale={locale} />)}
            </div>
          ) : null}
        </section>

        <section className="mx-auto w-full max-w-[1216px] px-4 pb-16 sm:px-6">
          <ArticleCta locale={locale} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
