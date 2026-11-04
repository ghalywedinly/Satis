import { expect, test, type Browser } from "@playwright/test";
import { emailCount, latestAlertLink, onboardWithSurvey, uniqueEmail } from "./helpers";

/** A customer gives a 1–5 rating, optionally with a comment, and sends it. */
async function answer(browser: Browser, url: string, rating: number, comment?: string) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  await page.goto(url);
  await page.getByRole("radiogroup", { name: "كيف كانت زيارتك اليوم؟" }).getByRole("radio", { name: String(rating) }).click();
  if (comment) await page.locator("textarea").first().fill(comment);
  await page.getByRole("button", { name: "أرسل رأيك" }).click();
  await expect(page.getByRole("status")).toContainText("شكرًا على رأيك");
  await context.close();
}

test.describe("notifications", () => {
  test("an unhappy customer emails the owner, until the owner turns alerts off", async ({ page, browser }) => {
    test.skip(!process.env.E2E_EMAIL_OUTBOX, "needs the dev email outbox");
    const owner = uniqueEmail("alerts-owner");
    const url = await onboardWithSurvey(page, "", "مقهى التنبيهات", owner);

    // A happy customer sends nothing; an unhappy one emails a link straight to their feedback.
    await answer(browser, url, 5);
    await answer(browser, url, 1, "الطلب تأخر كثيرًا");
    const link = await latestAlertLink(owner);
    const sent = await emailCount(owner);
    await page.goto(new URL(link).pathname);
    await expect(page.getByText("الطلب تأخر كثيرًا")).toBeVisible();

    // Each member chooses their own emails.
    await page.goto("/notifications");
    const alerts = page.getByRole("switch", { name: /تنبيه العملاء غير الراضين/ });
    await expect(alerts).toBeChecked();
    await expect(page.getByRole("switch", { name: /التقرير الأسبوعي/ })).toBeChecked();
    await alerts.uncheck({ force: true });
    await page.getByRole("button", { name: "احفظ إعدادات التنبيهات" }).click();
    await expect(page.getByText("حُفظت إعدادات التنبيهات.")).toBeVisible();
    await page.reload();
    await expect(page.getByRole("switch", { name: /تنبيه العملاء غير الراضين/ })).not.toBeChecked();

    await answer(browser, url, 2, "سيء");
    await page.waitForTimeout(3000);
    expect(await emailCount(owner)).toBe(sent);
  });
});
