import { expect, test } from "@playwright/test";
import { onboardWithSurvey } from "./helpers";

test.describe("Satis Score", () => {
  test("a business opens its public page, a customer publishes a comment, the team answers it", async ({ page, browser }) => {
    test.slow();
    const slug = `e2e-${Date.now().toString(36)}`;
    const url = await onboardWithSurvey(page, "", "مقهى النجمة");

    // Turn on the public page.
    await page.goto("/dashboard");
    await page.getByRole("navigation", { name: "التنقل الرئيسي" }).getByRole("link", { name: "تقييم ساتيس" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "تقييم ساتيس" })).toBeVisible();
    await page.getByRole("switch", { name: "اعرض صفحتك العامة" }).check();
    await page.getByLabel("رابط صفحتك").fill(slug);
    await page.getByLabel("نبذة قصيرة").fill("قهوة مختصة في الرياض.");
    await page.getByRole("button", { name: "احفظ الصفحة" }).click();
    await expect(page.getByText("حُفظت صفحتك.")).toBeVisible();
    await expect(page.getByRole("button", { name: "انسخ الكود" })).toBeVisible();

    // A customer answers with a comment and agrees to publish it.
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const customer = await context.newPage();
    await customer.goto(url);
    await customer.getByRole("radiogroup", { name: "كيف كانت زيارتك اليوم؟" }).getByRole("radio", { name: "2" }).click();
    await customer.getByRole("textbox").fill("القهوة باردة اليوم");
    await customer.getByRole("button", { name: "أرسل رأيك" }).click();
    await expect(customer.getByRole("heading", { name: "تنشر تعليقك على تقييم ساتيس؟" })).toBeVisible();
    await customer.getByLabel("اسمك الأول (اختياري)").fill("جود");
    await customer.getByRole("button", { name: "انشر تعليقي" }).click();
    await expect(customer.getByText("نُشر تعليقك. شكرًا لك.")).toBeVisible();
    await context.close();

    // The public page: no score yet (fewer than 25 ratings), the comment under the first name.
    const visitor = await browser.newPage();
    await visitor.goto(`/score/${slug}`);
    await expect(visitor.getByRole("heading", { level: 1, name: "مقهى النجمة" })).toBeVisible();
    await expect(visitor.getByText("التقييمات تُجمع الآن").first()).toBeVisible();
    const review = visitor.locator("article").filter({ hasText: "القهوة باردة اليوم" });
    await expect(review).toContainText("جود");

    // The team answers in public from the inbox.
    await page.goto("/inbox");
    await page.locator("main ul > li a").first().click();
    await page.getByLabel("اكتب ردك").fill("نعتذر يا جود، نراك قريبًا.");
    await page.getByRole("button", { name: "انشر الرد" }).click();
    await expect(page.getByText("نُشر ردك.")).toBeVisible();
    await visitor.reload();
    await expect(review).toContainText("نعتذر يا جود، نراك قريبًا.");

    // The directory finds it; the website badge reads it.
    await visitor.goto(`/score?q=${encodeURIComponent("النجمة")}`);
    await expect(visitor.getByRole("list", { name: "العلامات" }).locator(`a[href$="/score/${slug}"]`)).toContainText("مقهى النجمة");
    const badge = await visitor.request.get(`/api/score/${slug}?lang=en`);
    expect(badge.ok()).toBe(true);
    expect(await badge.json()).toMatchObject({ score: null, collecting: "Collecting ratings" });
    await visitor.close();
  });

  test("English directory and a page that doesn't exist", async ({ page }) => {
    await page.goto("/en/score");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Before you try it,");
    await expect(page.getByRole("heading", { level: 2, name: "Browse by category" })).toBeVisible();
    const missing = await page.goto("/en/score/no-such-brand-here");
    expect(missing?.status()).toBe(404);
  });
});
