import { expect, test } from "@playwright/test";

test.describe("blog", () => {
  test("Arabic blog: list, filter, search, read an article", async ({ page }) => {
    await page.goto("/");
    // The header menu is hidden on phones; the footer link is always there.
    await page.getByRole("contentinfo").getByRole("link", { name: "المدونة" }).click();
    await expect(page).toHaveURL(/\/blog$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("دليلك لفهم عملائك");

    // Topic filter.
    await page.getByRole("navigation", { name: "التصنيفات" }).getByRole("link", { name: "المطاعم والمقاهي" }).click();
    await expect(page).toHaveURL(/category=restaurants/);
    await expect(page.getByRole("link", { name: /5 أسئلة يجب أن يسألها كل مطعم/ })).toBeVisible();
    await expect(page.getByRole("link", { name: /الفرق بين CSAT وNPS/ })).toHaveCount(0);

    // Search with no result, then back to everything.
    await page.goto("/blog?q=zzzz");
    await expect(page.getByText("لا توجد مقالات مطابقة")).toBeVisible();
    await page.getByRole("link", { name: "عرض كل المقالات" }).click();

    // Open the featured article.
    await page.getByRole("link", { name: /كيف تحسب صافي نقاط الترويج/ }).first().click();
    await expect(page).toHaveURL(/\/blog\/how-to-calculate-nps$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("كيف تحسب صافي نقاط الترويج");
    await expect(page.getByRole("heading", { level: 2, name: "المعادلة" })).toBeVisible();

    // Table of contents jumps to a section.
    await page.getByRole("complementary", { name: "في هذا المقال" }).getByRole("link", { name: "المعادلة" }).click();
    await expect(page).toHaveURL(/#formula$/);

    // Structured data, canonical and hreflang for search engines.
    const jsonLd = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent()) ?? "{}");
    expect(jsonLd["@type"]).toBe("BlogPosting");
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", /\/blog\/how-to-calculate-nps$/);
    await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveAttribute("href", /\/en\/blog\/how-to-calculate-nps$/);

    // The call to action leads to booking.
    await page.locator("article").getByRole("link", { name: "احجز اجتماعًا" }).first().click();
    await expect(page).toHaveURL(/\/book$/);
  });

  test("English article and unknown slugs", async ({ page }) => {
    await page.goto("/en/blog/csat-vs-nps");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("CSAT vs NPS: what each one measures and when to use it");
    await expect(page.getByRole("heading", { level: 2, name: "Read next" })).toBeVisible();

    const missing = await page.goto("/en/blog/no-such-post");
    expect(missing?.status()).toBe(404);
  });

  test("sitemap and robots list the blog", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/blog/how-to-calculate-nps");
    expect(sitemap).toContain("/en/blog/csat-vs-nps");
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /dashboard");
    expect(robots).toContain("Sitemap:");
  });
});
