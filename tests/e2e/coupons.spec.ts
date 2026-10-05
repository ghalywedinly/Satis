import { expect, test } from "@playwright/test";
import { onboardWithSurvey } from "./helpers";

// Percentages sit in a left-to-right isolate inside sentences (see modules/coupons/definition.ts).
const pct = (n: number) => `\u2066${n}%\u2069`;

test.describe("rewards", () => {
  test("a reward is issued after the survey and redeemed once by the team", async ({ page, browser }) => {
    const url = await onboardWithSurvey(page, "", "مقهى المكافآت");
    await page.goto("/coupons");
    await expect(page.getByText("لا توجد مكافآت بعد.", { exact: false })).toBeVisible();

    // Create a 15% reward with a condition.
    await page.getByRole("button", { name: "أنشئ مكافأة" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("القيمة").fill("150");
    await dialog.getByLabel("الشروط بالعربية (اختياري)").fill("على أي مشروب");
    await dialog.getByRole("button", { name: "أنشئ مكافأة" }).click();
    await expect(dialog.getByText("أدخل نسبة من 1 إلى 100.")).toBeVisible();
    await dialog.getByLabel("القيمة").fill("١٥");
    await expect(dialog.getByText(`خصم ${pct(15)}`)).toBeVisible();
    await dialog.getByRole("button", { name: "أنشئ مكافأة" }).click();
    await expect(dialog).toBeHidden();
    const offer = page.locator("main li").filter({ hasText: `خصم ${pct(15)}` });
    await expect(offer).toContainText("على أي مشروب");
    await expect(offer).toContainText("فعّالة");
    await expect(offer).toContainText("صدر: 0");

    // A customer answers and gets a code.
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const customer = await context.newPage();
    await customer.goto(url);
    await customer.getByRole("radiogroup", { name: "كيف كانت زيارتك اليوم؟" }).getByRole("radio", { name: "5" }).click();
    await customer.getByRole("button", { name: "أرسل رأيك" }).click();
    await expect(customer.getByRole("status")).toContainText(`خصم ${pct(15)} على زيارتك القادمة`);
    await expect(customer.getByRole("status")).toContainText("على أي مشروب");
    const code = (await customer.getByTestId("coupon-code").textContent())!.trim();
    expect(code).toMatch(/^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/);
    await context.close();

    // The team checks and redeems it, typed casually.
    await page.reload();
    await expect(offer).toContainText("صدر: 1");
    await page.getByLabel("رمز الكوبون").fill(code.toLowerCase().replace("-", " "));
    await page.getByRole("button", { name: "تحقق من الرمز" }).click();
    await expect(page.getByText("صالح", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "استخدم الرمز" }).click();
    await expect(page.getByText("تم استخدام الرمز. امنح العميل خصمه.")).toBeVisible();
    await expect(page.getByText("مستخدم من قبل")).toBeVisible();
    await expect(offer).toContainText("استُخدم: 1");

    // The same code can't be used again; unknown codes are reported.
    await page.getByRole("button", { name: "تحقق من رمز آخر" }).click();
    await page.getByLabel("رمز الكوبون").fill(code);
    await page.getByRole("button", { name: "تحقق من الرمز" }).click();
    await expect(page.getByText("مستخدم من قبل")).toBeVisible();
    await expect(page.getByRole("button", { name: "استخدم الرمز" })).toHaveCount(0);
    await page.getByLabel("رمز الكوبون").fill("ZZZZ-ZZZZ");
    await page.getByRole("button", { name: "تحقق من الرمز" }).click();
    await expect(page.getByText("لا يوجد كوبون بهذا الرمز.", { exact: false })).toBeVisible();

    // Pausing stops new codes.
    await offer.getByRole("button", { name: "أوقف المكافأة مؤقتًا" }).click();
    await expect(offer).toContainText("متوقفة مؤقتًا");
  });

  test("rewards page in English", async ({ page }) => {
    await onboardWithSurvey(page, "/en", "Rewards Café");
    await page.goto("/en/coupons");
    await expect(page.getByRole("heading", { name: "Rewards", level: 1 })).toBeVisible();
    await page.getByRole("button", { name: "Create reward" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByText("Fixed amount (SAR)").click();
    await dialog.getByLabel("Value").fill("20");
    await expect(dialog.getByText("SAR 20 off")).toBeVisible();
    await dialog.getByRole("button", { name: "Create reward" }).click();
    await expect(page.locator("main li").filter({ hasText: "SAR 20 off" })).toContainText("All locations");
  });
});
