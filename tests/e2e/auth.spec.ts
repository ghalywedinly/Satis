import { expect, test } from "@playwright/test";
import { formAlert, formStatus, latestAuthLink, logInWith, logOut, PASSWORD, signUpAndVerify, uniqueEmail } from "./helpers";

test.describe("authentication", () => {
  test("sign up in Arabic, verify email, start onboarding, log out", async ({ page }) => {
    const email = uniqueEmail("signup-ar");
    await signUpAndVerify(page, { email, name: "نورة الحربي", localePrefix: "" });
    await expect(page.getByRole("heading", { level: 1, name: "أهلًا بك في ساتيس" })).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await logOut(page);
    await expect(page).toHaveURL(/localhost:\d+\/$/);
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login\?next=/);
  });

  test("log in is refused before the email is verified", async ({ page }) => {
    const email = uniqueEmail("unverified");
    await page.goto("/en/signup");
    await page.locator('input[name="fullName"]').fill("Faisal");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(email)).toBeVisible();

    await logInWith(page, email, PASSWORD, "/en");
    await expect(formAlert(page)).toHaveText("Verify your email before logging in.");
  });

  test("validation errors are shown per field and keep entered values", async ({ page }) => {
    await page.goto("/en/signup");
    await page.locator('input[name="fullName"]').fill("Sara");
    await page.locator('input[name="email"]').fill("not-an-email");
    await page.locator('input[name="password"]').fill("short");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText("Enter a valid email address.")).toBeVisible();
    await expect(page.getByText("Password must be at least 8 characters.")).toBeVisible();
    await expect(page.locator('input[name="fullName"]')).toHaveValue("Sara");
    await expect(page.locator('input[name="password"]')).toHaveAttribute("aria-invalid", "true");
  });

  test("wrong password shows a translated error", async ({ page }) => {
    const email = uniqueEmail("wrong-password");
    await signUpAndVerify(page, { email, name: "Omar", localePrefix: "/en" });
    await logOut(page);
    await logInWith(page, email, "Wrong-password-1");
    await expect(formAlert(page)).toHaveText("البريد الإلكتروني أو كلمة المرور غير صحيحة.");
  });

  test("log in returns to the page the user was going to", async ({ page }) => {
    const email = uniqueEmail("next");
    await signUpAndVerify(page, { email, name: "Huda", localePrefix: "/en" });
    await logOut(page);
    await page.goto("/en/dashboard");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/en\/(dashboard|onboarding)$/);
  });

  test("reset a forgotten password", async ({ page }) => {
    const email = uniqueEmail("reset");
    await signUpAndVerify(page, { email, name: "Layla", localePrefix: "/en" });
    await logOut(page);

    await page.goto("/en/forgot-password");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('button[type="submit"]').click();
    await expect(formStatus(page)).toContainText("reset link is on its way");

    await page.goto(await latestAuthLink(email));
    await expect(page).toHaveURL(/\/en\/reset-password$/);
    await page.locator('input[name="password"]').fill("New-password-2026");
    await page.locator('input[name="confirmPassword"]').fill("New-password-2026");
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/\/en\/(dashboard|onboarding)$/);

    await logOut(page);
    await logInWith(page, email, "New-password-2026", "/en");
    await expect(page).toHaveURL(/\/en\/(dashboard|onboarding)$/);
  });

  test("an invalid email link is rejected gracefully", async ({ page }) => {
    await page.goto("/auth/confirm?token_hash=bogus&type=signup&lang=en");
    await expect(page).toHaveURL(/\/en\/login\?error=linkInvalid$/);
    await expect(formAlert(page)).toContainText("invalid or has expired");
  });

  test("open redirects are refused after log in", async ({ page }) => {
    const email = uniqueEmail("open-redirect");
    await signUpAndVerify(page, { email, name: "Khalid", localePrefix: "" });
    await logOut(page);
    await page.goto(`/login?next=${encodeURIComponent("https://evil.example.com/")}`);
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill(PASSWORD);
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL(/localhost:\d+\/(dashboard|onboarding)$/);
  });

  test("the chosen language is saved to the account", async ({ page }) => {
    const email = uniqueEmail("locale");
    await signUpAndVerify(page, { email, name: "Reem", localePrefix: "" });
    await page.getByRole("button", { name: /English/ }).click();
    await expect(page).toHaveURL(/\/en\/onboarding$/);
    await expect(page.getByRole("heading", { level: 1, name: "Welcome to Satis" })).toBeVisible();

    await logOut(page);
    // Logging in from the Arabic page still opens the dashboard in the saved language.
    await logInWith(page, email, PASSWORD, "");
    await expect(page).toHaveURL(/\/en\/(dashboard|onboarding)$/);
  });
});
