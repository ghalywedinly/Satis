import type { MetadataRoute } from "next";
import { routing } from "@/lib/i18n/routing";
import { languageUrls, siteUrl } from "@/lib/seo";
import { allPosts } from "@/modules/blog";

/** Public pages for search engines, each with its Arabic and English address. */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: { path: string; lastModified?: string; priority: number }[] = [
    { path: "/", priority: 1 },
    { path: "/book", priority: 0.8 },
    { path: "/blog", lastModified: allPosts()[0]?.date, priority: 0.8 },
    ...allPosts().map((post) => ({ path: `/blog/${post.slug}`, lastModified: post.date, priority: 0.6 })),
  ];
  return pages.flatMap(({ path, lastModified, priority }) =>
    routing.locales.map((locale) => ({
      url: siteUrl(locale, path),
      lastModified,
      priority,
      alternates: { languages: languageUrls(path) },
    })),
  );
}
