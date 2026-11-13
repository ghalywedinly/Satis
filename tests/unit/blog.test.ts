import { describe, expect, it } from "vitest";
import { allPosts, BLOG_CATEGORIES, findPosts, getPost, headings, isBlogCategory, plainText, relatedPosts, splitInline } from "@/modules/blog";

describe("blog posts", () => {
  const posts = allPosts();

  it("every post has a unique, URL-safe slug", () => {
    const slugs = posts.map((p) => p.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it("every post is complete in Arabic and English, with matching structure", () => {
    for (const post of posts) {
      expect(BLOG_CATEGORIES).toContain(post.category);
      expect(post.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(post.date))).toBe(false);
      expect(post.readMinutes).toBeGreaterThan(0);
      const { ar, en } = post.content;
      for (const c of [ar, en]) {
        expect(c.title.trim(), post.slug).not.toBe("");
        expect(c.excerpt.trim(), post.slug).not.toBe("");
        expect(c.blocks.length, post.slug).toBeGreaterThan(0);
      }
      // Same sections in the same order, so the language switch lands on the same article.
      expect(ar.blocks.map((b) => b.type), post.slug).toEqual(en.blocks.map((b) => b.type));
      expect(headings(ar.blocks).map((h) => h.id), post.slug).toEqual(headings(en.blocks).map((h) => h.id));
      expect(/[؀-ۿ]/.test(ar.title), post.slug).toBe(true);
    }
  });

  it("section ids are unique within a post", () => {
    for (const post of posts) {
      const ids = headings(post.content.en.blocks).map((h) => h.id);
      expect(new Set(ids).size, post.slug).toBe(ids.length);
    }
  });

  it("[[…]] marks are balanced in every text", () => {
    for (const post of posts) {
      const text = JSON.stringify(post.content);
      expect((text.match(/\[\[/g) ?? []).length, post.slug).toBe((text.match(/\]\]/g) ?? []).length);
    }
  });

  it("lists newest first and looks posts up by slug", () => {
    const dates = posts.map((p) => p.date);
    expect([...dates].sort().reverse()).toEqual(dates);
    expect(getPost(posts[0].slug)).toBe(posts[0]);
    expect(getPost("does-not-exist")).toBeUndefined();
  });
});

describe("blog helpers", () => {
  it("splits left-to-right runs out of Arabic text", () => {
    expect(splitInline("النتيجة [[60 − 15 = 45]] تقريبًا")).toEqual([
      { text: "النتيجة ", ltr: false },
      { text: "60 − 15 = 45", ltr: true },
      { text: " تقريبًا", ltr: false },
    ]);
    expect(plainText("من [[0]] إلى [[10]]")).toBe("من 0 إلى 10");
  });

  it("filters by category and searches titles in the reader's language", () => {
    expect(findPosts("en", { category: "nps" }).every((p) => p.category === "nps")).toBe(true);
    expect(findPosts("en", { query: "csat" }).map((p) => p.slug)).toContain("csat-vs-nps");
    // Hamza and taa marbuta variants still match.
    expect(findPosts("ar", { query: "اسئله" }).map((p) => p.slug)).toContain("restaurant-feedback-questions");
    expect(findPosts("en", { query: "nothing like this" })).toEqual([]);
  });

  it("validates categories from the address bar", () => {
    expect(isBlogCategory("nps")).toBe(true);
    expect(isBlogCategory("<script>")).toBe(false);
    expect(isBlogCategory(["nps"])).toBe(false);
  });

  it("suggests other posts, never the one being read", () => {
    const post = allPosts()[0];
    const related = relatedPosts(post);
    expect(related.map((p) => p.slug)).not.toContain(post.slug);
    expect(related.length).toBeLessThanOrEqual(3);
  });
});
