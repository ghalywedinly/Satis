import { expect, test, type Page } from "@playwright/test";
import { emailCount, uniqueEmail } from "./helpers";

// Bookings share one calendar, so these run one at a time.
test.describe.configure({ mode: "serial" });

/**
 * Picks an open time on the first day that has one. Desktop and mobile runs happen side by side,
 * so they take times from opposite ends of the day.
 */
async function pickFirstTime(page: Page) {
  const open = page.getByRole("radiogroup", { name: /Time|الوقت/ }).getByRole("radio").and(page.locator(":enabled"));
  const time = test.info().project.name === "mobile" ? open.last() : open.first();
  const label = (await time.textContent()) ?? "";
  await time.click();
  return label;
}

async function fillDetails(page: Page, english: boolean, email: string) {
  await page.getByLabel(english ? "Full name" : "الاسم الكامل").fill("Rakan Alotaibi");
  await page.getByLabel(english ? "Company" : "الشركة").fill("Qahwa House");
  await page.getByLabel(english ? "Email" : "البريد الإلكتروني").fill(email);
  await page.getByLabel(english ? "Mobile number" : "رقم الجوال").fill("055 123 4567");
}

test.describe("book a meeting", () => {
  test("the landing call to action books a meeting in Arabic", async ({ page }) => {
    const email = uniqueEmail("booking-ar");
    await page.goto("/");
    await page.getByRole("link", { name: "احجز موعدًا" }).first().click();
    await expect(page).toHaveURL(/\/book$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("لنتحدث عن عملائك.");

    // Nothing to continue with until a time is chosen.
    const next = page.getByRole("button", { name: "تابع إلى البيانات" });
    await expect(next).toBeDisabled();
    await pickFirstTime(page);
    await next.click();

    // Validation: every field, in Arabic, below its input.
    await page.getByRole("button", { name: "احجز الموعد" }).click();
    await expect(page.getByText("هذا الحقل مطلوب.").first()).toBeVisible();
    await page.getByLabel("رقم الجوال").fill("12345");
    await page.getByRole("button", { name: "احجز الموعد" }).click();
    await expect(page.getByText("أدخل رقم جوال صحيحًا.")).toBeVisible();

    await fillDetails(page, false, email);
    await page.getByRole("button", { name: "احجز الموعد" }).click();
    await expect(page.getByRole("heading", { name: "تم حجز موعدك يا Rakan." })).toBeVisible();
    await expect(page.getByText(email)).toBeVisible();
    await expect(page.getByRole("link", { name: "أضف الموعد إلى تقويم Google" })).toHaveAttribute("href", /calendar\.google\.com/);
    await expect.poll(() => emailCount(email)).toBe(1);
  });

  test("a time booked by someone else is refused and marked taken", async ({ browser }) => {
    const first = await (await browser.newContext()).newPage();
    const second = await (await browser.newContext()).newPage();
    for (const page of [first, second]) {
      await page.goto("/en/book");
      await pickFirstTime(page);
      await page.getByRole("button", { name: "Continue to details" }).click();
    }
    await fillDetails(first, true, uniqueEmail("booking-first"));
    await first.getByRole("button", { name: "Book the meeting" }).click();
    await expect(first.getByRole("heading", { name: "You're booked, Rakan." })).toBeVisible();

    const email = uniqueEmail("booking-second");
    await fillDetails(second, true, email);
    await second.getByRole("button", { name: "Book the meeting" }).click();
    await expect(second.locator("main [role=alert]")).toHaveText("Someone just booked that time. Pick another one.");
    await expect(second.getByRole("radio", { name: /Booked/ }).first()).toBeDisabled();

    // The details are kept while they choose again.
    await pickFirstTime(second);
    await second.getByRole("button", { name: "Continue to details" }).click();
    await expect(second.getByLabel("Email")).toHaveValue(email);
    await second.getByRole("button", { name: "Book the meeting" }).click();
    await expect(second.getByRole("heading", { name: "You're booked, Rakan." })).toBeVisible();
    await first.context().close();
    await second.context().close();
  });
});
