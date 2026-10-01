import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { expect, type Page } from "@playwright/test";

export const uniqueEmail = (label: string) =>
  `e2e+${label}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;

export const PASSWORD = "Satis-e2e-2026";

/** Latest /auth/confirm link sent to `to`, read from the dev outbox or Mailpit. Polls for up to 15s. */
export async function latestAuthLink(to: string): Promise<string> {
  for (let attempt = 0; attempt < 30; attempt++) {
    const link = process.env.E2E_EMAIL_OUTBOX ? await fromOutbox(to) : await fromMailpit(to);
    if (link) return link;
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`No auth email for ${to}`);
}

const extractLink = (text: string) => text.match(/https?:\/\/[^\s"'<>]+\/auth\/confirm\?[^\s"'<>]+/)?.[0]?.replaceAll("&amp;", "&") ?? null;

async function fromOutbox(to: string) {
  const dir = process.env.E2E_EMAIL_OUTBOX!;
  const files = (await readdir(dir).catch(() => [])).filter((f) => f.endsWith(".json")).sort().reverse();
  for (const file of files) {
    const message = JSON.parse(await readFile(path.join(dir, file), "utf8"));
    if (message.to === to) return extractLink(message.text);
  }
  return null;
}

async function fromMailpit(to: string) {
  const base = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";
  const search = await fetch(`${base}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}&limit=1`).then((r) => r.json());
  const id = search.messages?.[0]?.ID;
  if (!id) return null;
  const message = await fetch(`${base}/api/v1/message/${id}`).then((r) => r.json());
  return extractLink(message.HTML ?? message.Text ?? "");
}

export async function signUpAndVerify(page: Page, { email, name, localePrefix }: { email: string; name: string; localePrefix: "" | "/en" }) {
  await page.goto(`${localePrefix}/signup`);
  await page.locator('input[name="fullName"]').fill(name);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(new RegExp(`${localePrefix}/verify-email$`));
  await page.goto(await latestAuthLink(email));
  await expect(page).toHaveURL(new RegExp(`${localePrefix}/dashboard$`));
}

export async function logInWith(page: Page, email: string, password = PASSWORD, localePrefix: "" | "/en" = "") {
  await page.goto(`${localePrefix}/login`);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
}

export async function logOut(page: Page) {
  await page.locator("header button[aria-haspopup='menu']").click();
  await page.getByRole("menuitem").last().click();
  // Logging out lands on the home page in the current language.
  await expect(page).toHaveURL(/localhost:\d+\/(en)?$/);
}

/** The form-level message inside the page (Next.js also renders a route announcer with role="alert"). */
export const formAlert = (page: Page) => page.locator("main [role=alert]");
export const formStatus = (page: Page) => page.locator("main [role=status]");
