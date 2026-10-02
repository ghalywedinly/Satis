import { expect, test, type Browser } from "@playwright/test";
import { onboardWithSurvey } from "./helpers";

// CI and local runs use AI_PROVIDER=fake: a keyword stand-in, so no AI service is called.

async function answer(browser: Browser, url: string, rating: number, comment: string) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  await page.goto(url);
  await page.getByRole("radiogroup", { name: "كيف كانت زيارتك اليوم؟" }).getByRole("radio", { name: String(rating) }).click();
  await page.getByRole("textbox").fill(comment);
  await page.getByRole("button", { name: "أرسل رأيك" }).click();
  await expect(page.getByRole("status")).toContainText("شكرًا على رأيك");
  await context.close();
}

test.describe("AI analysis", () => {
  test("comments are analysed into themes and a weekly summary with evidence", async ({ page, browser }) => {
    test.setTimeout(90_000);
    const url = await onboardWithSurvey(page, "", "مقهى الرؤى");
    await answer(browser, url, 2, "الانتظار طويل جدًا");
    await answer(browser, url, 4, "الموظفون لطفاء لكن الانتظار طويل");
    await answer(browser, url, 5, "المكان نظيف والقهوة لذيذة");

    await page.goto("/dashboard");
    const insights = page.locator("main section").filter({ hasText: "رؤى هذا الأسبوع" });
    await expect(insights).toContainText("تعليقات بانتظار التحليل: 3");
    await insights.getByRole("button", { name: "حلّل التعليقات الآن" }).click();

    // The summary is labelled as AI, cites its comments, and the theme counts appear.
    await expect(insights).toContainText("تحليل بالذكاء الاصطناعي");
    await expect(insights).toContainText("من 3 تعليقًا محللًا");
    await expect(insights.getByText("مبنية على هذه التعليقات")).toBeVisible();
    await expect(insights.getByRole("link", { name: /افتح التعليق/ }).first()).toBeVisible();
    const themes = insights.locator("div", { hasText: "ما يتحدث عنه العملاء" }).last();
    await expect(themes).toContainText("السرعة والانتظار");
    await expect(themes).toContainText("النظافة");
    await expect(insights).not.toContainText("تعليقات بانتظار التحليل");

    // The inbox shows the themes and filters by them.
    await page.goto("/inbox");
    await page.getByLabel("الموضوع").selectOption("speed");
    await expect(page).toHaveURL(/theme=speed/);
    await expect(page.getByText("عدد الإجابات: 2")).toBeVisible();
    await page.getByRole("link", { name: /الموظفون لطفاء/ }).click();
    const card = page.locator("[data-slot=card]").filter({ hasText: "تحليل بالذكاء الاصطناعي" });
    await expect(card).toContainText("مختلط");
    await expect(card).toContainText("الموظفون");
    await expect(card).toContainText("قد يخطئ الذكاء الاصطناعي");
  });

  test("cron routes refuse requests without the secret", async ({ request }) => {
    expect((await request.get("/api/cron/ai-analyze")).status()).toBe(401);
    expect((await request.get("/api/cron/ai-analyze", { headers: { authorization: "Bearer wrong" } })).status()).toBe(401);
  });
});
