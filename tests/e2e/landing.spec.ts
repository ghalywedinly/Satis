import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("Arabic landing page: sections, pricing and sign-up", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("اسمع عملاءك. افهم أعمالك. حسّن كل تجربة.");
    for (const heading of ["من رمز QR إلى قرار، في أربع خطوات", "كل ما تحتاجه لتسمع عملاءك", "امسح. أجب. انتهى.", "سعر واحد واضح", "أسئلة يطرحها أصحاب الأعمال"]) {
      await expect(page.getByRole("heading", { level: 2, name: heading })).toBeVisible();
    }
    await expect(page.locator("#pricing")).toContainText("150 ر.س");
    // FAQ answers open on demand.
    await page.getByText("هل يحتاج عملائي إلى تنزيل تطبيق؟").click();
    await expect(page.getByText("لا. يمسح العميل رمز QR بكاميرا الجوال")).toBeVisible();
    await page.locator("main").getByRole("link", { name: "ابدأ مجانًا" }).first().click();
    await expect(page).toHaveURL(/\/signup$/);
  });

  test("English landing page links to sections and log in", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("#pricing")).toContainText("SAR 150");
    await page.getByRole("link", { name: "See how it works" }).click();
    await expect(page).toHaveURL(/#how$/);
    await page.getByRole("banner").getByRole("link", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/login$/);
  });
});
