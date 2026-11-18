import { expect, test } from "@playwright/test";

// Google Tag Manager runs on public marketing pages only, never where teams or customers enter data.
test.describe("third-party tags", () => {
  test("Tag Manager loads on marketing pages and is allowed by the CSP", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.headers()["content-security-policy"]).toContain("googletagmanager.com");
    await expect(page.locator("script#gtm")).toHaveCount(1);
    await page.goto("/en/blog");
    await expect(page.locator("script#gtm")).toHaveCount(1);
  });

  test("Tag Manager is not loaded on sign-in pages", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("script#gtm")).toHaveCount(0);
    await expect(page.locator('script[src*="googletagmanager"]')).toHaveCount(0);
  });
});
