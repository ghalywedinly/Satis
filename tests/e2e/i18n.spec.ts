import { expect, test } from "@playwright/test";

test.describe("language and direction", () => {
  test("Arabic is the default, right-to-left", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("اسمع عملاءك. افهم أعمالك. حسّن كل تجربة.");
  });

  test("English lives under /en, left-to-right", async ({ page }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Listen to your customers. Understand your business. Improve every experience.",
    );
  });

  test("an English browser still gets Arabic by default", async ({ browser }) => {
    const context = await browser.newContext({ locale: "en-US" });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await context.close();
  });

  test("the language switcher keeps the current page", async ({ page }) => {
    await page.goto("/signup");
    await page.getByRole("button", { name: /English/ }).click();
    await expect(page).toHaveURL(/\/en\/signup$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await page.getByRole("button", { name: /العربية/ }).click();
    await expect(page).toHaveURL(/\/signup$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("redundant /ar prefix redirects to the clean URL", async ({ page }) => {
    await page.goto("/ar/login");
    await expect(page).toHaveURL(/localhost:\d+\/login$/);
  });

  test("unknown pages show a localized not-found page", async ({ page }) => {
    const response = await page.goto("/en/does-not-exist");
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });

  test("protected pages redirect to login in the same language", async ({ page }) => {
    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/login\?next=%2Fen%2Fdashboard$/);
  });
});
