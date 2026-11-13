import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { SiteFooter } from "@/components/marketing/sections";
import { SiteHeader } from "@/components/marketing/site-header";
import { formatCount } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { routing } from "@/lib/i18n/routing";
import { resolveLocale } from "@/lib/i18n/server";
import { pageAlternates, siteOrigin, siteUrl } from "@/lib/seo";
import { allPosts, getPost, headings, plainText, relatedPosts } from "@/modules/blog";
import { ArticleBody } from "@/modules/blog/components/article-body";
import { PostCover } from "@/modules/blog/components/cover";
import { Inline } from "@/modules/blog/components/inline";
import { PostCard } from "@/modules/blog/components/post-card";
import { PostDate } from "@/modules/blog/components/post-meta";
import { ShareButtons } from "@/modules/blog/components/share-buttons";

// Posts are files in the repository: every article is built ahead of time, and unknown slugs are 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => allPosts().map((post) => ({ locale, slug: post.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/blog/[slug]">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const { title, excerpt } = post.content[locale];
  return {
    title,
    description: plainText(excerpt),
    alternates: pageAlternates(locale, `/blog/${post.slug}`),
    openGraph: { type: "article", title, description: plainText(excerpt), publishedTime: post.date, locale: locale === "ar" ? "ar_SA" : "en_US" },
  };
}

export default async function ArticlePage({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const locale = await resolveLocale(params);
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const t = await getTranslations({ locale, namespace: "blog" });
  const { title, excerpt, blocks } = post.content[locale];
  const url = siteUrl(locale, `/blog/${post.slug}`);
  const toc = headings(blocks);
  const related = relatedPosts(post);

  // Structured data so search engines understand the page is an article by Satis.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: plainText(excerpt),
    datePublished: post.date,
    inLanguage: locale,
    mainEntityOfPage: url,
    author: { "@type": "Organization", name: "Satis" },
    publisher: { "@type": "Organization", name: "Satis", logo: { "@type": "ImageObject", url: `${siteOrigin()}/icon.svg` } },
  };

  return (
    <div className="flex min-h-dvh flex-col bg-sand">
      <SiteHeader />
      <main id="content" className="flex-1">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <article>
          <header className="mx-auto flex w-full max-w-[860px] flex-col gap-5 px-4 pt-10 pb-8 sm:px-6 sm:pt-14">
            <nav aria-label={t("breadcrumb")}>
              <ol className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
                <li>
                  <Link href="/blog" className="rounded-xs underline-offset-4 outline-none hover:text-ink hover:underline focus-visible:shadow-focus">
                    {t("backToBlog")}
                  </Link>
                </li>
                <li aria-hidden>{"/"}</li>
                <li>
                  <Link
                    href={`/blog?category=${post.category}`}
                    className="rounded-xs font-semibold text-ultramarine underline-offset-4 outline-none hover:underline focus-visible:shadow-focus"
                  >
                    {t(`categories.${post.category}`)}
                  </Link>
                </li>
              </ol>
            </nav>
            <h1 className="text-[clamp(30px,4vw,46px)] leading-[1.25] font-extrabold tracking-[-0.02em] text-ink">{title}</h1>
            <p className="text-lg leading-relaxed text-ink-600 sm:text-xl">
              <Inline text={excerpt} />
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span aria-hidden className="flex size-11 items-center justify-center rounded-full bg-ultra-50 font-bold text-ultramarine">
                {t("authorInitial")}
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[15px] font-semibold text-ink">{t("author")}</span>
                <div className="flex flex-wrap items-center gap-2 text-sm text-ink-500">
                  <PostDate post={post} locale={locale} />
                  <span aria-hidden>{"·"}</span>
                  <span>{t("readTime", { minutes: formatCount(locale, post.readMinutes) })}</span>
                </div>
              </div>
              <ShareButtons url={url} title={title} className="ms-auto" />
            </div>
          </header>

          <div className="mx-auto w-full max-w-[1216px] px-4 pb-10 sm:px-6">
            <PostCover post={post} locale={locale} large className="h-[220px] rounded-card sm:h-[400px]" />
          </div>

          <div className="mx-auto flex w-full max-w-[1216px] flex-wrap items-start gap-10 px-4 pb-16 sm:px-6 lg:gap-12">
            {toc.length > 1 ? (
              <aside aria-label={t("contents")} className="w-full lg:sticky lg:top-24 lg:w-[260px]">
                <details open className="group rounded-card border border-border bg-white p-4 lg:p-5">
                  <summary className="cursor-pointer list-none text-sm font-bold text-ink-600 marker:hidden">{t("contents")}</summary>
                  <ol className="mt-3 flex flex-col gap-1">
                    {toc.map((h) => (
                      <li key={h.id}>
                        <a
                          href={`#${h.id}`}
                          className="block rounded-control px-3 py-2 text-[15px] leading-snug text-ink-600 outline-none transition-colors duration-[140ms] hover:bg-sand-100 hover:text-ink focus-visible:shadow-focus"
                        >
                          <Inline text={h.text} />
                        </a>
                      </li>
                    ))}
                  </ol>
                </details>
              </aside>
            ) : null}
            <div className="min-w-0 flex-[999_1_560px] lg:max-w-[720px]">
              <ArticleBody blocks={blocks} locale={locale} />
            </div>
          </div>
        </article>

        {related.length > 0 ? (
          <section aria-labelledby="related" className="border-t border-border">
            <div className="mx-auto flex w-full max-w-[1216px] flex-col gap-6 px-4 py-12 sm:px-6 sm:py-14">
              <h2 id="related" className="text-2xl font-bold text-ink">
                {t("related")}
              </h2>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-6">
                {related.map((p) => (
                  <PostCard key={p.slug} post={p} locale={locale} />
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </div>
  );
}
