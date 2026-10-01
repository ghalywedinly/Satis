import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

export const uniqueEmail = (label: string) =>
  `e2e+${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

export const PASSWORD = "Satis-e2e-2026";

/** Latest /auth/confirm link sent to `to` (verification, password reset). */
export const latestAuthLink = (to: string) => latestEmailLink(to, /https?:\/\/[^\s"'<>]+\/auth\/confirm\?[^\s"'<>]+/);

/** Latest team invitation link sent to `to`. */
export const latestInviteLink = (to: string) => latestEmailLink(to, /https?:\/\/[^\s"'<>]+\/invite\/[A-Za-z0-9_-]{43}/);

/**
 * Polls for up to 15s for an email to `to` containing a link matching `pattern`. Emails sent by the
 * app are read from its dev outbox (E2E_EMAIL_OUTBOX); emails sent by Supabase from Mailpit (MAILPIT_URL).
 */
async function latestEmailLink(to: string, pattern: RegExp): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const texts = [...(await fromOutbox(to)), ...(await fromMailpit(to))];
    for (const text of texts) {
      const link = text.match(pattern)?.[0]?.replaceAll("&amp;", "&");
      if (link) return link;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No email for ${to} matching ${pattern}`);
}

async function fromOutbox(to: string): Promise<string[]> {
  const dir = process.env.E2E_EMAIL_OUTBOX;
  if (!dir) return [];
  const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith(".json")).sort().reverse();
  const texts: string[] = [];
  for (const file of files) {
    const message = JSON.parse(await readFile(path.join(dir, file), "utf8"));
    if (message.to === to) texts.push(message.text);
  }
  return texts;
}

async function fromMailpit(to: string): Promise<string[]> {
  const base = process.env.MAILPIT_URL;
  if (!base) return [];
  const search = await fetch(`${base}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}&limit=5`).then((r) => r.json());
  const texts: string[] = [];
  for (const summary of search.messages ?? []) {
    const message = await fetch(`${base}/api/v1/message/${summary.ID}`).then((r) => r.json());
    texts.push(message.HTML ?? message.Text ?? "");
  }
  return texts;
}

export async function signUpAndVerify(page: Page, { email, name, localePrefix }: { email: string; name: string; localePrefix: "" | "/en" }) {
  await page.goto(`${localePrefix}/signup`);
  await page.locator('input[name="fullName"]').fill(name);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${localePrefix}/verify-email$`));
  await page.goto(await latestAuthLink(email));
  // New accounts have no business yet, so they land on onboarding.
  await expect(page).toHaveURL(new RegExp(`${localePrefix}/onboarding$`));
}

export async function logInWith(page: Page, email: string, password = PASSWORD, localePrefix: "" | "/en" = "") {
  await page.goto(`${localePrefix}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

export async function logOut(page: Page) {
  // The user menu is the last menu in the header (the business switcher comes first).
  await page.locator("header button[aria-haspopup='menu']").last().click();
  await page.getByRole("menuitem").last().click();
  // Logging out lands on the home page in the current language.
  await expect(page).toHaveURL(/localhost:\d+\/(en)?$/);
}

/** The form-level message inside the page (Next.js also renders a route announcer with role="alert"). */
export const formAlert = (page: Page) => page.locator("main [role=alert]");
export const formStatus = (page: Page) => page.locator("main [role=status]");

/** Onboarding: creates a business with its first location and lands on the dashboard. */
export async function createBusiness(page: Page, { name, type, location, city }: { name: string; type: string; location: string; city?: string }) {
  await page.goto(page.url().includes("/en/") ? "/en/onboarding?new=1" : "/onboarding?new=1");
  const start = page.locator("form section:not([hidden]) button", { hasText: /Start setup|ابدأ الإعداد/ });
  if (await start.isVisible()) await start.click();
  await page.locator('input[name="name"]').fill(name);
  await page.getByRole("button", { name: /^(Next|التالي)$/ }).click();
  await page.locator(`label:has(input[name="businessType"][value="${type}"])`).click();
  await page.getByRole("button", { name: /^(Next|التالي)$/ }).click();
  await page.locator('input[name="locationName"]').fill(location);
  if (city) await page.locator('input[name="locationCity"]').fill(city);
  await page.locator('button[type="submit"]').click();
  // Onboarding continues with the first survey; tests that don't need one skip it.
  await expect(page).toHaveURL(/\/onboarding\/survey$/);
  await page.getByRole("link", { name: /^(Skip for now|تخطَّ الآن)$/ }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

/** The business shown in the header switcher. */
export const currentBusiness = (page: Page, name: string) =>
  page.getByRole("button", { name: new RegExp(`(Current business|النشاط التجاري الحالي): ${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) });
