import { expect, test, type Browser } from "@playwright/test";
import { onboardWithSurvey } from "./helpers";

/** A customer answers the default survey: a rating (1–5) and a recommendation score (0–10). */
async function answer(browser: Browser, url: string, rating: number, nps: number) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  await page.goto(url);
  await page.getByRole("radiogroup", { name: "كيف كانت زيارتك اليوم؟" }).getByRole("radio", { name: String(rating) }).click();
  await page.getByRole("radiogroup", { name: /توصي/ }).getByRole("radio", { name: String(nps), exact: true }).click();
  await page.getByRole("button", { name: "أرسل رأيك" }).click();
  await expect(page.getByRole("status")).toContainText("شكرًا على رأيك");
  await context.close();
}

test.describe("analytics dashboard", () => {
  test("scores, charts, locations and per-question results", async ({ page, browser }) => {
    const url = await onboardWithSurvey(page, "", "مقهى الأرقام");
    await page.goto("/dashboard");
    await expect(page.getByText("لا توجد إجابات في هذه الفترة", { exact: true })).toBeVisible();

    await answer(browser, url, 5, 10);
    await answer(browser, url, 4, 8);
    await answer(browser, url, 2, 3);
    await page.reload();

    // KPIs: 3 responses; CSAT 2 of 3 rated 4–5; NPS 1 promoter − 1 detractor = 0.
    const kpis = page.locator("main section").first();
    const tile = (label: string) => kpis.getByRole("group", { name: label, exact: true });
    await expect(tile("الإجابات").locator("p.font-display")).toHaveText("3");
    await expect(tile("رضا العملاء (CSAT)").locator("p.font-display")).toHaveText("67%");
    await expect(tile("رضا العملاء (CSAT)")).toContainText("المتوسط 3.7 من 5");
    await expect(tile("صافي نقاط الترويج (NPS)").locator("p.font-display")).toHaveText("0");

    await expect(page.getByRole("heading", { name: "الإجابات يوميًا" })).toBeVisible();
    await expect(page.getByRole("img", { name: "توزيع NPS" })).toBeVisible();
    await expect(page.getByText("المروّجون (9–10)")).toBeVisible();
    const location = page.getByRole("row", { name: /جدة - التحلية/ });
    await expect(location).toContainText("3");
    await expect(location).toContainText("67%");

    // Pick the survey to see each question.
    await expect(page.getByText("اختر استبيانًا من الأعلى لترى نتائج كل سؤال.")).toBeVisible();
    await page.getByLabel("الاستبيان").selectOption({ index: 1 });
    await expect(page).toHaveURL(/survey=/);
    const questions = page.locator("main ol > li");
    await expect(questions.first()).toContainText("كيف كانت زيارتك اليوم؟");
    await expect(questions.first()).toContainText("المتوسط 3.7 من 5");
    // Nobody wrote a comment.
    await expect(questions.last()).toContainText("لا توجد إجابات في هذه الفترة.");

    // Periods: today still counts everything; a custom range in the past is empty.
    await page.getByLabel("الفترة").selectOption("today");
    await expect(page).toHaveURL(/period=today/);
    await expect(tile("الإجابات").locator("p.font-display")).toHaveText("3");
    await page.getByLabel("الفترة").selectOption("custom");
    await page.getByLabel("من").fill("2026-01-01");
    await page.getByLabel("إلى").fill("2026-01-31");
    await page.getByRole("button", { name: "طبّق" }).click();
    await expect(page).toHaveURL(/period=custom&from=2026-01-01&to=2026-01-31/);
    await expect(page.getByText("لا توجد إجابات في هذه الفترة", { exact: true })).toBeVisible();
  });

  test("the dashboard works in English", async ({ page }) => {
    await onboardWithSurvey(page, "/en", "Numbers Café");
    await page.goto("/en/dashboard?period=7&survey=not-a-uuid");
    await expect(page.getByText("Net Promoter Score (NPS)")).toBeVisible();
    await expect(page.getByText("No responses in this period")).toBeVisible();
    await expect(page.getByRole("row", { name: /Jeddah - Tahlia/ })).toBeVisible();
  });
});
