import { expect, test } from "@playwright/test";
import { createBusiness, makePlatformAdmin, signUpAndVerify, uniqueEmail } from "./helpers";

test.describe("managing bookings (Satis team)", () => {
  test("only the Satis team sees bookings; they confirm, add a link, move and cancel them", async ({ page, browser }) => {
    test.setTimeout(120_000);
    const owner = uniqueEmail("team");
    await signUpAndVerify(page, { email: owner, name: "Satis Team", localePrefix: "/en" });
    await createBusiness(page, { name: "Satis HQ", type: "other", location: "Jeddah" });

    // A business owner who isn't on the team: the area doesn't exist for them.
    await page.goto("/en/admin/bookings");
    await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
    await page.goto("/en/dashboard");
    await expect(page.getByRole("link", { name: "Bookings" })).toHaveCount(0);

    // A visitor books a demo call.
    const company = `Qahwa ${Date.now().toString(36)}`;
    const visitor = await (await browser.newContext()).newPage();
    await visitor.goto("/en/book");
    const booked = visitor.getByRole("heading", { name: "You're booked, Rakan." });
    const taken = visitor.locator("main [role=alert]").filter({ hasText: "Someone just booked that time" });
    // Tests run side by side and share one calendar: if another run takes the time, pick again.
    for (let attempt = 0; attempt < 4 && !(await booked.isVisible()); attempt++) {
      const open = visitor.getByRole("radiogroup", { name: "Time" }).getByRole("radio").and(visitor.locator(":enabled"));
      const count = await open.count();
      await open.nth(Math.floor(Math.random() * count)).click();
      await visitor.getByRole("button", { name: "Continue to details" }).click();
      if (attempt === 0) {
        await visitor.getByLabel("Full name").fill("Rakan Alotaibi");
        await visitor.getByLabel("Company").fill(company);
        await visitor.getByLabel("Email").fill(uniqueEmail("visitor"));
        await visitor.getByLabel("Mobile number").fill("055 123 4567");
      }
      await visitor.getByRole("button", { name: "Book the meeting" }).click();
      await expect(booked.or(taken)).toBeVisible();
    }
    await expect(visitor.getByRole("heading", { name: "You're booked, Rakan." })).toBeVisible();
    await visitor.context().close();

    await makePlatformAdmin(owner);
    await page.goto("/en/dashboard");
    await page.getByRole("link", { name: "Bookings" }).first().click();
    await expect(page).toHaveURL(/\/en\/admin\/bookings$/);

    // New bookings wait for a reply; one tap confirms.
    const reply = page.getByRole("region", { name: "Needs your reply" });
    const row = reply.getByRole("listitem").filter({ hasText: company });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "Confirm" }).click();
    await expect(reply.getByText(company)).toHaveCount(0);

    // Details: add the meeting link and notes.
    await page.goto("/en/admin/bookings/pipeline");
    const confirmed = page.getByRole("region", { name: "Confirmed", exact: true });
    await confirmed.getByRole("link", { name: company }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Rakan Alotaibi" })).toBeVisible();
    await expect(page.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /wa\.me\/966551234567/);
    await page.getByLabel("Meeting link").fill("ftp://nope");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Enter a link starting with https://")).toBeVisible();
    await page.getByLabel("Meeting link").fill("https://meet.google.com/abc-defg-hij");
    await page.getByLabel("Notes").fill("Three branches in Jeddah");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Saved.")).toBeVisible();
    await expect(page.getByRole("link", { name: "Send the link on WhatsApp" })).toHaveAttribute("href", /meet\.google\.com/);

    // Pipeline: move it on with the card's menu.
    await page.goto("/en/admin/bookings/pipeline");
    const card = page.getByRole("article").filter({ hasText: company });
    await expect(card).toContainText("Three branches in Jeddah");
    await card.getByLabel("Move to").selectOption("held");
    await expect(page.getByRole("region", { name: "Call held" }).getByText(company)).toBeVisible();
    // Saved, not just shown: still there after reloading.
    await page.waitForLoadState("networkidle");
    await page.reload();
    await expect(page.getByRole("region", { name: "Call held" }).getByText(company)).toBeVisible();

    // Cancelling asks first and takes it off the board.
    await page.getByRole("region", { name: "Call held" }).getByRole("link", { name: company }).click();
    await page.getByRole("button", { name: "Cancel and free the slot" }).click();
    await page.getByRole("button", { name: "Cancel meeting" }).click();
    await expect(page.getByRole("radiogroup", { name: "Status" }).getByRole("radio", { name: "Cancelled" })).toHaveAttribute("aria-checked", "true");
    await page.goto("/en/admin/bookings/pipeline");
    await expect(page.getByText(company)).toHaveCount(0);
  });
});
