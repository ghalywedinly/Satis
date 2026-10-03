import { expect, test, type Browser } from "@playwright/test";
import { onboardWithSurvey } from "./helpers";

/** A customer answers the default survey in Arabic on their phone. */
async function answer(browser: Browser, url: string, { score, comment }: { score: number; comment?: string }) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const page = await context.newPage();
  await page.goto(url);
  await page.getByRole("radiogroup", { name: "كيف كانت زيارتك اليوم؟" }).getByRole("radio", { name: String(score) }).click();
  if (comment) await page.getByRole("textbox").fill(comment);
  await page.getByRole("button", { name: "أرسل رأيك" }).click();
  await expect(page.getByRole("status")).toContainText("شكرًا على رأيك");
  await context.close();
}

test.describe("feedback inbox", () => {
  test("read, triage, tag, search and filter customer feedback", async ({ page, browser }) => {
    const url = await onboardWithSurvey(page, "", "مقهى الآراء");
    await page.goto("/inbox");
    await expect(page.getByText("لا توجد آراء بعد")).toBeVisible();

    await answer(browser, url, { score: 2, comment: "الانتظار طويل جدًا" });
    await answer(browser, url, { score: 5 });

    // Both responses arrive unread, newest first.
    await page.reload();
    const nav = page.getByRole("navigation", { name: "التنقل الرئيسي" });
    await expect(nav.getByRole("link", { name: /الآراء/ })).toContainText("2");
    await expect(page.getByText("عدد الإجابات: 2")).toBeVisible();
    const items = page.locator("main ul > li");
    await expect(items.first()).toContainText("بدون تعليق");
    await expect(items.nth(1)).toContainText("الانتظار طويل جدًا");
    await expect(items.nth(1)).toContainText("سلبي");

    // Search what customers wrote.
    await page.getByRole("searchbox", { name: "ابحث في التعليقات" }).fill("الانتظار");
    await page.getByRole("button", { name: "ابحث", exact: true }).click();
    await expect(page).toHaveURL(/q=/);
    await expect(page.getByText("عدد الإجابات: 1")).toBeVisible();
    await page.getByRole("link", { name: "امسح الفلاتر" }).first().click();
    await expect(page.getByText("عدد الإجابات: 2")).toBeVisible();

    // Filter by sentiment, then open the response: it's marked read.
    await page.getByLabel("الانطباع").selectOption("negative");
    await expect(page).toHaveURL(/sentiment=negative/);
    await expect(page.getByText("عدد الإجابات: 1")).toBeVisible();
    await page.locator("main ul > li a").first().click();
    await expect(page).toHaveURL(/\/inbox\/[0-9a-f-]{36}\?sentiment=negative$/);
    await expect(page.getByText("كيف كانت زيارتك اليوم؟")).toBeVisible();
    await expect(page.getByText("2 من 5").first()).toBeVisible();
    await expect(nav.getByRole("link", { name: /الآراء/ })).toContainText("1");

    // Follow up: status, important, a new tag.
    await page.getByLabel("الحالة").selectOption("in_progress");
    await expect(page.getByLabel("الحالة")).toHaveValue("in_progress");
    await page.getByRole("button", { name: "ميّزه كمهم" }).click();
    await expect(page.getByRole("button", { name: "أزل علامة «مهم»" })).toBeVisible();
    await page.getByRole("combobox", { name: "اسم الوسم" }).fill("وقت الانتظار");
    await page.getByRole("button", { name: "أضف وسمًا" }).click();
    await expect(page.getByRole("button", { name: "أزل الوسم وقت الانتظار" })).toBeVisible();

    // Back to the same filtered view, which reflects the changes.
    await page.getByRole("link", { name: "العودة إلى الآراء" }).click();
    await expect(page).toHaveURL(/\/inbox\?sentiment=negative$/);
    await expect(items.first()).toContainText("قيد المتابعة");
    await expect(items.first()).toContainText("مهم");
    await expect(items.first()).toContainText("وقت الانتظار");

    await page.getByRole("link", { name: "امسح الفلاتر" }).first().click();
    await expect(page).toHaveURL(/\/inbox$/);
    await page.getByLabel("الوسم").selectOption({ label: "وقت الانتظار" });
    await expect(page).toHaveURL(/tag=/);
    await expect(page.getByText("عدد الإجابات: 1")).toBeVisible();
    await page.getByRole("link", { name: "امسح الفلاتر" }).first().click();
    await expect(page).toHaveURL(/\/inbox$/);
    await page.getByLabel("المهمة فقط").check();
    await expect(page).toHaveURL(/important=1/);
    await expect(page.getByText("عدد الإجابات: 1")).toBeVisible();
    await page.getByLabel("المهمة فقط").uncheck();
    await expect(page).not.toHaveURL(/important=/);
    await page.getByLabel("غير المقروءة فقط").check();
    await expect(page).toHaveURL(/unread=1/);
    await expect(page.getByText("عدد الإجابات: 1")).toBeVisible();
    await expect(items.first()).toContainText("بدون تعليق");

    // Removing the tag and marking unread put things back.
    await page.getByLabel("غير المقروءة فقط").uncheck();
    await expect(page).not.toHaveURL(/unread=/);
    await page.getByRole("link", { name: /الانتظار طويل جدًا/ }).click();
    await page.getByRole("button", { name: "أزل الوسم وقت الانتظار" }).click();
    await expect(page.getByText("لا توجد وسوم بعد")).toBeVisible();
    await page.getByRole("button", { name: "اجعله غير مقروء" }).click();
    await expect(nav.getByRole("link", { name: /الآراء/ })).toContainText("2");
  });

  test("the inbox works in English and rejects unknown responses", async ({ page }) => {
    await onboardWithSurvey(page, "/en", "Inbox Café");
    await page.goto("/en/inbox");
    await expect(page.getByRole("heading", { name: "Feedback", level: 1 })).toBeVisible();
    await expect(page.getByText("No feedback yet")).toBeVisible();
    await expect(page.getByText("Responses: 0")).toBeVisible();
    // Odd values in the URL are ignored rather than breaking the page.
    await page.goto("/en/inbox?status=bogus&period=999&page=abc&survey=nope");
    await expect(page.getByText("Responses: 0")).toBeVisible();
    const missing = await page.goto("/en/inbox/00000000-0000-4000-8000-000000000000");
    expect(missing?.status()).toBe(404);
  });
});
