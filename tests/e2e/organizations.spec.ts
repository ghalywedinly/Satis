import { expect, test, type Browser } from "@playwright/test";
import {
  createBusiness,
  currentBusiness,
  formAlert,
  formStatus,
  latestAuthLink,
  latestInviteLink,
  logInWith,
  PASSWORD,
  signUpAndVerify,
  uniqueEmail,
} from "./helpers";

async function newOwner(browser: Browser, label: string, localePrefix: "" | "/en", business: string) {
  const context = await browser.newContext();
  const page = await context.newPage();
  const email = uniqueEmail(label);
  await signUpAndVerify(page, { email, name: `Owner ${label}`, localePrefix });
  await createBusiness(page, { name: business, type: "cafe", location: "Jeddah - Tahlia", city: "Jeddah" });
  return { context, page, email };
}

test.describe("businesses and teams", () => {
  test("onboarding in Arabic validates each step and creates the business", async ({ page }) => {
    await signUpAndVerify(page, { email: uniqueEmail("onboard-ar"), name: "سارة", localePrefix: "" });
    await expect(page.getByText("الخطوة 1 من 7")).toBeVisible();
    await page.getByRole("button", { name: "ابدأ الإعداد" }).click();

    // Each step must be completed before moving on.
    await page.getByRole("button", { name: "التالي" }).click();
    await expect(page.getByText("هذا الحقل مطلوب.")).toBeVisible();
    await page.locator('input[name="name"]').fill("مقهى سارة");
    await page.getByRole("button", { name: "التالي" }).click();
    await page.getByRole("button", { name: "التالي" }).click();
    await expect(page.getByText("اختر نوع نشاطك.")).toBeVisible();
    await page.getByText("مقهى", { exact: true }).click();
    await page.getByRole("button", { name: "التالي" }).click();
    await expect(page.getByText("الخطوة 4 من 7")).toBeVisible();

    await page.locator('input[name="locationName"]').fill("الرياض - العليا");
    await page.locator('input[name="locationCity"]').fill("الرياض");
    await page.getByRole("button", { name: "أنشئ نشاطي التجاري" }).click();

    await expect(page).toHaveURL(/localhost:\d+\/onboarding\/survey$/);
    await expect(page.getByText("الخطوة 5 من 7")).toBeVisible();
    await page.getByRole("link", { name: "تخطَّ الآن" }).click();
    await expect(currentBusiness(page, "مقهى سارة")).toBeVisible();
    await page.getByRole("navigation").getByRole("link", { name: "الفروع", exact: true }).click();
    await expect(page.getByText("الرياض - العليا")).toBeVisible();
  });

  test("manage locations: add, edit, archive and restore", async ({ browser }) => {
    const { context, page } = await newOwner(browser, "locations", "/en", "Nora Café");
    await page.goto("/en/locations");

    await page.getByRole("button", { name: "Add location" }).click();
    await page.getByRole("dialog").locator('input[name="name"]').fill("Riyadh - Olaya");
    await page.getByRole("dialog").locator('input[name="city"]').fill("Riyadh");
    await page.getByRole("dialog").getByRole("button", { name: "Add location" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
    await expect(page.getByText("Riyadh - Olaya")).toBeVisible();

    await page.getByRole("button", { name: "Edit Riyadh - Olaya" }).click();
    await page.getByRole("dialog").locator('input[name="name"]').fill("Riyadh - Olaya Street");
    await page.getByRole("dialog").getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByText("Riyadh - Olaya Street")).toBeVisible();

    await page.getByRole("button", { name: "Archive Riyadh - Olaya Street" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Archive" }).click();
    await expect(page.getByText("Archived locations (1)")).toBeVisible();
    await page.getByText("Archived locations (1)").click();
    await page.getByRole("button", { name: "Restore Riyadh - Olaya Street" }).click();
    await expect(page.getByText("Archived locations")).toBeHidden();
    await context.close();
  });

  test("invite a teammate who signs up from the link, then manage their role", async ({ browser }) => {
    const owner = await newOwner(browser, "inviter", "/en", "Faisal Gym");
    const inviteeEmail = uniqueEmail("invitee");

    await owner.page.goto("/en/team");
    await owner.page.locator('input[name="email"]').fill(inviteeEmail);
    await owner.page.locator('select[name="role"]').selectOption("manager");
    await owner.page.getByRole("button", { name: "Send invitation" }).click();
    await expect(formStatus(owner.page)).toContainText(inviteeEmail);
    await expect(owner.page.getByText("Pending invitations")).toBeVisible();

    // The invitee opens the link signed out, creates an account, verifies, and comes back to accept.
    const invitee = await browser.newContext();
    const page = await invitee.newPage();
    await page.goto(await latestInviteLink(inviteeEmail));
    await page.getByRole("link", { name: "Create account" }).click();
    await page.locator('input[name="fullName"]').fill("Huda");
    await page.locator('input[name="email"]').fill(inviteeEmail);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/en\/verify-email$/);
    await page.goto(await latestAuthLink(inviteeEmail));
    await expect(page.getByRole("heading", { name: "Join Faisal Gym" })).toBeVisible();
    await page.getByRole("button", { name: "Accept invitation" }).click();
    await expect(page).toHaveURL(/\/en\/dashboard$/);
    await expect(currentBusiness(page, "Faisal Gym")).toBeVisible();

    // Managers can't manage the team or settings.
    await expect(page.getByRole("link", { name: "Settings" })).toBeHidden();
    await page.goto("/en/team");
    await expect(page.getByText("Owners and admins manage the team.")).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeHidden();
    await page.goto("/en/settings");
    await expect(page).toHaveURL(/\/en\/dashboard$/);

    // The owner makes them a viewer; they can no longer change locations.
    await owner.page.reload();
    await expect(owner.page.getByText("Pending invitations")).toBeHidden();
    await owner.page.getByRole("combobox", { name: "Role for Huda" }).selectOption("viewer");
    await expect(owner.page.getByRole("combobox", { name: "Role for Huda" })).toHaveValue("viewer");
    await page.goto("/en/locations");
    await expect(page.getByText("You need the manager role or higher to change locations.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Add location" })).toBeHidden();

    // The owner can't demote themselves, and removing Huda revokes her access.
    await expect(owner.page.getByRole("combobox", { name: /Role for Owner/ })).toBeHidden();
    await owner.page.getByRole("button", { name: "Remove Huda" }).click();
    await owner.page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
    // While the dialog is open the page behind it is hidden from role queries, so wait for it to close first.
    await expect(owner.page.getByRole("alertdialog")).toBeHidden();
    await expect(owner.page.getByRole("listitem").filter({ hasText: "Huda" })).toHaveCount(0);
    await page.goto("/en/dashboard");
    await expect(page).toHaveURL(/\/en\/onboarding$/);

    await owner.context.close();
    await invitee.close();
  });

  test("an invitation can't be used by a different account", async ({ browser }) => {
    const owner = await newOwner(browser, "mismatch-owner", "/en", "Reem Salon");
    const invited = uniqueEmail("intended");
    await owner.page.goto("/en/team");
    await owner.page.locator('input[name="email"]').fill(invited);
    await owner.page.getByRole("button", { name: "Send invitation" }).click();
    await expect(formStatus(owner.page)).toBeVisible();

    const other = await browser.newContext();
    const page = await other.newPage();
    await signUpAndVerify(page, { email: uniqueEmail("someone-else"), name: "Other", localePrefix: "/en" });
    await page.goto(await latestInviteLink(invited));
    await expect(formAlert(page)).toContainText("sent to a different email");
    await expect(page.getByRole("button", { name: "Accept invitation" })).toBeHidden();
    await owner.context.close();
    await other.close();
  });

  test("the last owner can't leave", async ({ browser }) => {
    const { context, page } = await newOwner(browser, "last-owner", "/en", "Solo Bakery");
    await page.goto("/en/team");
    await page.getByRole("button", { name: "Leave business" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Leave business" }).click();
    await expect(page.getByRole("alertdialog").getByRole("alert")).toHaveText("A business needs at least one owner.");
    await context.close();
  });

  test("owners edit settings, create a second business and switch between them", async ({ browser }) => {
    const { context, page } = await newOwner(browser, "multi", "/en", "First Café");
    await page.goto("/en/settings");
    await page.locator('input[name="name"]').fill("First Café & Bakery");
    await page.locator('select[name="defaultLocale"]').selectOption("en");
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(formStatus(page)).toHaveText("Changes saved.");
    await expect(page.getByRole("button", { name: /Current business: First Café & Bakery/ })).toBeVisible();

    await page.getByRole("button", { name: /Current business/ }).click();
    await page.getByRole("menuitem", { name: "Create a new business" }).click();
    await expect(page).toHaveURL(/\/en\/onboarding\?new=1$/);
    await expect(page.getByText("Step 2 of 7")).toBeVisible();
    await page.locator('input[name="name"]').fill("Second Gym");
    await page.getByRole("button", { name: "Next" }).click();
    await page.getByText("Gym", { exact: true }).click();
    await page.getByRole("button", { name: "Next" }).click();
    await page.locator('input[name="locationName"]').fill("Dammam");
    await page.getByRole("button", { name: "Create my business" }).click();
    await page.getByRole("link", { name: "Skip for now" }).click();
    await expect(currentBusiness(page, "Second Gym")).toBeVisible();

    await page.getByRole("button", { name: /Current business: Second Gym/ }).click();
    await page.getByRole("menuitem", { name: "First Café & Bakery" }).click();
    await expect(currentBusiness(page, "First Café & Bakery")).toBeVisible();
    await context.close();
  });

  test("returning users skip onboarding and see their business", async ({ browser }) => {
    const { context, page, email } = await newOwner(browser, "returning", "", "مطعم الريم");
    await page.locator("header button[aria-haspopup='menu']").last().click();
    await page.getByRole("menuitem").last().click();
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await logInWith(page, email);
    await expect(page).toHaveURL(/localhost:\d+\/dashboard$/);
    await expect(currentBusiness(page, "مطعم الريم")).toBeVisible();
    await page.goto("/onboarding");
    await expect(page).toHaveURL(/localhost:\d+\/dashboard$/);
    await context.close();
  });
});
