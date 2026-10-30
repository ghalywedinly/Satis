import { expect, test } from "@playwright/test";
import { onboardWithSurvey } from "./helpers";

test.describe("survey design", () => {
  test("a ready-made look, then a colour and rating style, reach customers once published", async ({ page, browser }) => {
    await onboardWithSurvey(page, "/en", "Design Café");
    await page.goto("/en/surveys");
    await page.getByRole("button", { name: "Create survey" }).click();
    await expect(page).toHaveURL(/\/en\/surveys\/[0-9a-f-]{36}$/);

    // A ready-made look sets colour, background and rating style together.
    await page.getByRole("button", { name: "Warm" }).click();
    await expect(page.getByRole("button", { name: "Warm" })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("radiogroup", { name: "Rating style" }).getByRole("radio", { name: "Faces" })).toBeChecked();

    // Then each part can be changed on its own; the preview follows straight away.
    await page.getByRole("radio", { name: "Green" }).click();
    await page.getByRole("radiogroup", { name: "Rating style" }).getByRole("radio", { name: "Stars" }).click();
    await expect(page.getByRole("button", { name: "Warm" })).toHaveAttribute("aria-pressed", "false");
    const preview = page.locator("aside");
    await expect(preview.getByRole("button", { name: "Send feedback" })).toHaveClass(/bg-mint-600/);

    await page.getByRole("button", { name: "Publish survey" }).click();
    await expect(page.getByText("Survey published. Your customers can answer it now.")).toBeVisible();
    await page.getByRole("link", { name: "QR codes" }).click();
    const link = (await page.locator("li bdi").first().textContent())!.trim();

    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
    const customer = await context.newPage();
    await customer.goto(`${link}/en`);
    await expect(customer.getByRole("button", { name: "Send feedback" })).toHaveClass(/bg-mint-600/);
    // Stars answer the same 1–5 score as every other style.
    await customer.getByRole("radiogroup", { name: "How was your visit today?" }).getByRole("radio", { name: "4" }).click();
    await customer.getByRole("button", { name: "Send feedback" }).click();
    await expect(customer.getByRole("status")).toContainText("Thanks for your feedback");
    await context.close();
  });
});
