import { expect, test, type Browser } from "@playwright/test";
import { onboardWithSurvey } from "./helpers";

async function customer(browser: Browser, url: string) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  return { context, page: await context.newPage(), url };
}

test.describe("surveys", () => {
  test("onboarding creates a live survey whose QR link customers can answer", async ({ page, browser }) => {
    const url = await onboardWithSurvey(page, "", "مقهى نورة");
    await expect(page.getByText("الخطوة 6 من 7")).toBeVisible();
    // The QR image is served (and only to members).
    const qr = await page.request.get(`/api/qr/${url.split("/s/")[1]}?format=png&download=1`);
    expect(qr.status()).toBe(200);
    expect(qr.headers()["content-type"]).toBe("image/png");
    await page.getByRole("link", { name: "التالي" }).click();
    await expect(page.getByText("ضع رمز QR حيث يراه عملاؤك بسهولة.")).toBeVisible();
    await page.getByRole("link", { name: "اذهب إلى لوحة التحكم" }).click();
    await expect(page).toHaveURL(/localhost:\d+\/dashboard$/);

    // A customer scans the code: Arabic by default, right to left, no account.
    const c = await customer(browser, url);
    await c.page.goto(url);
    await expect(c.page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(c.page.getByText("كيف كانت زيارتك اليوم؟")).toBeVisible();
    await c.page.getByRole("button", { name: "أرسل رأيك" }).click();
    await expect(c.page.getByText("أجب عن هذا السؤال للمتابعة.")).toBeVisible();

    await c.page.getByRole("radiogroup", { name: "كيف كانت زيارتك اليوم؟" }).getByRole("radio", { name: "5" }).click();
    await c.page.getByRole("checkbox", { name: "النظافة" }).click();
    await c.page.getByRole("checkbox", { name: "سرعة الخدمة" }).click();
    await c.page.getByRole("radio", { name: "9", exact: true }).click();
    await c.page.getByRole("textbox").fill("خدمة رائعة");
    await c.page.getByRole("button", { name: "أرسل رأيك" }).click();
    await expect(c.page.getByRole("status")).toContainText("شكرًا على رأيك");

    // The response reaches the business.
    await page.reload();
    const kpis = page.locator("main section").first();
    await expect(kpis.getByText("الإجابات", { exact: true })).toBeVisible();
    await expect(kpis.locator("p.font-display").first()).toHaveText("1");
    await c.context.close();
  });

  test("customers can switch the survey to English", async ({ page, browser }) => {
    const url = await onboardWithSurvey(page, "", "مقهى اللغة");
    const c = await customer(browser, url);
    await c.page.goto(url);
    await c.page.getByRole("link", { name: "English" }).click();
    await expect(c.page).toHaveURL(/\/s\/[A-Za-z0-9]+\/en$/);
    await expect(c.page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(c.page.getByText("How was your visit today?")).toBeVisible();
    await c.context.close();
  });

  test("build, preview, publish, share, pause and resume a survey", async ({ page, browser }) => {
    const url = await onboardWithSurvey(page, "/en", "Builder Café");
    await page.goto("/en/surveys");
    await page.getByRole("button", { name: "Create survey" }).click();
    await expect(page).toHaveURL(/\/en\/surveys\/[0-9a-f-]{36}$/);

    // Edit: rename, remove the NPS question, add a single-choice question without Arabic text.
    await page.getByLabel("Survey name").fill("Weekend survey");
    await page.getByRole("button", { name: "Remove question 3" }).click();
    await page.getByRole("button", { name: "Add question" }).click();
    await page.getByRole("menuitem", { name: "Single choice" }).click();
    await page.getByLabel("Question text (English)").last().fill("Did you order delivery?");
    await page.getByLabel("Option 1 (English)").last().fill("Yes");
    await page.getByLabel("Option 2 (English)").last().fill("No");
    await page.getByRole("button", { name: "Move question 4 up" }).click();

    // The preview reflects the unsaved draft (this business set up in English, so English comes first).
    const preview = page.locator("aside");
    await expect(preview.getByText("Did you order delivery?")).toBeVisible();
    await preview.getByRole("radio", { name: "العربية" }).click();
    await expect(preview.getByText("كيف كانت زيارتك اليوم؟")).toBeVisible();

    // Publishing requires every language to be complete.
    await page.getByRole("button", { name: "Publish changes" }).or(page.getByRole("button", { name: "Publish survey" })).click();
    await expect(page.getByText("Question 3: write the text in العربية.")).toBeVisible();
    await page.getByLabel("Question text (العربية)").nth(2).fill("هل طلبت توصيلًا؟");
    await page.getByLabel("Option 1 (العربية)").last().fill("نعم");
    await page.getByLabel("Option 2 (العربية)").last().fill("لا");
    await page.getByRole("button", { name: "Publish survey" }).click();
    await expect(page.getByText("Survey published. Your customers can answer it now.")).toBeVisible();

    // Share: a QR code per location, downloadable, with a public link.
    await page.getByRole("link", { name: "QR codes" }).click();
    await expect(page.getByRole("heading", { name: "Jeddah - Tahlia" })).toBeVisible();
    const link = (await page.locator("li bdi").first().textContent())!.trim();
    expect(link).not.toBe(url);
    const svg = await page.request.get(`/api/qr/${link.split("/s/")[1]}?format=svg`);
    expect(svg.headers()["content-type"]).toBe("image/svg+xml");

    const c = await customer(browser, link);
    await c.page.goto(link);
    await expect(c.page.getByText("Did you order delivery?")).toBeVisible();

    // Turning the location's link off, or pausing the survey, closes it to customers.
    // The switch updates instantly; wait for the server to save it before checking as a customer.
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.ok()),
      page.getByRole("checkbox", { name: "Collect feedback at Jeddah - Tahlia" }).uncheck(),
    ]);
    await expect(page.getByText("Paused at this location")).toBeVisible();
    await c.page.reload();
    await expect(c.page.getByText("This survey isn't available right now")).toBeVisible();
    await Promise.all([
      page.waitForResponse((r) => r.request().method() === "POST" && r.ok()),
      page.getByRole("checkbox", { name: "Collect feedback at Jeddah - Tahlia" }).check(),
    ]);
    await expect(page.getByText("Collecting feedback")).toBeVisible();

    await page.getByRole("button", { name: "Pause survey" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Pause survey" }).click();
    await expect(page.getByText("Paused", { exact: true })).toBeVisible();
    await c.page.reload();
    await expect(c.page.getByText("This survey isn't available right now")).toBeVisible();
    await page.getByRole("button", { name: "Resume survey" }).click();
    await expect(page.getByText("Live", { exact: true })).toBeVisible();
    await c.page.reload();
    await expect(c.page.getByText("Did you order delivery?")).toBeVisible();
    await c.context.close();
  });

  test("a customer answering an outdated version is asked to reload", async ({ page, browser }) => {
    const url = await onboardWithSurvey(page, "/en", "Changing Café");
    const c = await customer(browser, url);
    await c.page.goto(url);
    await c.page.getByRole("radiogroup").first().getByRole("radio", { name: "4" }).click();

    // Meanwhile the owner publishes an edit.
    await page.goto("/en/surveys");
    await page.locator("main ul a").first().click();
    await page.getByRole("button", { name: "Remove question 4" }).click();
    await page.getByRole("button", { name: "Publish changes" }).click();
    await expect(page.getByText("Survey published.")).toBeVisible();

    await c.page.getByRole("button", { name: "Send feedback" }).click();
    await expect(c.page.locator("main [role=alert]")).toHaveText("This survey was just updated. Reload the page to continue.");
    await c.context.close();
  });

  test("unknown or unsupported survey links show a friendly page", async ({ page, request }) => {
    const response = await page.goto("/s/NoSuchCode1");
    expect(response?.status()).toBe(200);
    await expect(page.getByText("هذا الاستبيان غير متاح حاليًا")).toBeVisible();
    await page.goto("/s/NoSuchCode1/en");
    await expect(page.getByText("This survey isn't available right now")).toBeVisible();
    // QR images are for signed-in members only.
    expect((await request.get("/api/qr/NoSuchCode1?format=svg")).status()).toBe(404);
  });
});
