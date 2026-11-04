import { expect, test, type Browser, type Page } from "@playwright/test";
import { onboardWithSurvey } from "./helpers";

// A 1×1 PNG, as a researcher's logo.
const LOGO = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
const KNOWLEDGE = "How would you rate your knowledge of the topic?";
const CONFIDENCE = "How confident do you feel putting it into practice?";

/** Publishes the survey open in the builder and returns its public link. */
async function publishAndGetLink(page: Page) {
  await page.getByRole("button", { name: "Publish survey" }).click();
  await expect(page.getByText("Survey published. Your customers can answer it now.")).toBeVisible();
  await page.getByRole("link", { name: "QR codes" }).click();
  return (await page.locator("li bdi").first().textContent())!.trim();
}

/** A participant answers the two rating questions. Returns the page so tests can check what it says. */
async function answer(browser: Browser, url: string, scores: [number, number]) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true });
  const participant = await context.newPage();
  await participant.goto(url);
  await participant.getByRole("radiogroup", { name: KNOWLEDGE }).getByRole("radio", { name: String(scores[0]) }).click();
  await participant.getByRole("radiogroup", { name: CONFIDENCE }).getByRole("radio", { name: String(scores[1]) }).click();
  await participant.getByRole("button", { name: "Send feedback" }).click();
  return { participant, context };
}

test.describe("studies", () => {
  test("a before-and-after study matches participants and reports the change", async ({ page, browser }) => {
    test.setTimeout(120_000);
    await onboardWithSurvey(page, "/en", "Learning Lab");

    await page.goto("/en/studies");
    await expect(page.getByRole("heading", { name: "Run your first before-and-after study" })).toBeVisible();
    await page.getByRole("link", { name: "New study" }).click();
    await page.getByLabel("Study name").fill("Service training");
    await page.getByLabel("Description").fill("Does the March training improve knowledge and confidence?");
    await page.getByRole("button", { name: "Create study" }).click();
    await expect(page).toHaveURL(/\/en\/studies\/[0-9a-f-]{36}$/);
    const studyUrl = page.url();
    await expect(page.getByRole("heading", { level: 1, name: "Service training" })).toBeVisible();

    // The before-survey gets the business's own colour, font and logo.
    await page.getByRole("link", { name: "Edit questions" }).first().click();
    await expect(page.getByText("Before-survey", { exact: true }).first()).toBeVisible();
    await page.getByRole("radio", { name: "Custom" }).first().click();
    await page.getByRole("textbox", { name: "Your colour: Hex code" }).fill("#0F766E");
    await page.getByRole("radiogroup", { name: "Font" }).getByRole("radio", { name: /Cairo/ }).click();
    await page.getByLabel("Upload logo").setInputFiles({ name: "logo.png", mimeType: "image/png", buffer: LOGO });
    await expect(page.getByRole("img", { name: "Logo preview" })).toBeVisible();
    await page.getByRole("radiogroup", { name: "Position" }).getByRole("radio", { name: "Start" }).click();
    const preview = page.locator("aside").last();
    await expect(preview.getByRole("button", { name: "Send feedback" })).toHaveClass(/bg-\[var\(--sv-accent\)\]/);
    await expect(preview.getByLabel("Your participant code")).toBeVisible();
    const before = await publishAndGetLink(page);

    await page.goto(studyUrl);
    await page.getByRole("link", { name: "Edit questions" }).last().click();
    await expect(page.getByText("After-survey", { exact: true }).first()).toBeVisible();
    const after = await publishAndGetLink(page);

    // Participant codes can come in the link, typed in any case.
    const first = await answer(browser, `${before}/en?p=p-001`, [2, 2]);
    await expect(first.participant.getByRole("status")).toContainText("Thanks for your feedback");
    await first.context.close();

    const context = await browser.newContext();
    const second = await context.newPage();
    await second.goto(`${before}/en`);
    await expect(second.getByRole("img", { name: "Learning Lab" })).toBeVisible();
    // A code is needed before sending.
    await second.getByRole("radiogroup", { name: KNOWLEDGE }).getByRole("radio", { name: "3" }).click();
    await second.getByRole("radiogroup", { name: CONFIDENCE }).getByRole("radio", { name: "3" }).click();
    await second.getByRole("button", { name: "Send feedback" }).click();
    await expect(second.getByText("Enter your participant code: letters, numbers and dashes only.")).toBeVisible();
    await second.getByLabel("Your participant code").fill("P-002");
    await second.getByRole("button", { name: "Send feedback" }).click();
    await expect(second.getByRole("status")).toContainText("Thanks for your feedback");
    await context.close();

    // The same code can't answer the same survey twice.
    const again = await answer(browser, `${before}/en?p=P-001`, [5, 5]);
    await expect(again.participant.locator("main [role=alert]")).toHaveText("This participant code has already answered this survey.");
    await again.context.close();

    for (const [code, scores] of [["P-001", [4, 5]], ["P-002", [4, 4]]] as const) {
      const done = await answer(browser, `${after}/en?p=${code}`, [...scores]);
      await expect(done.participant.getByRole("status")).toContainText("Thanks for your feedback");
      await done.context.close();
    }

    await page.goto(studyUrl);
    const tile = (label: string) => page.getByRole("listitem").filter({ hasText: label });
    await expect(tile("Before answers")).toContainText("2");
    await expect(tile("Matched participants")).toContainText("2");
    await expect(tile("Follow-up rate")).toContainText("100%");
    const knowledge = page.getByRole("region", { name: KNOWLEDGE });
    await expect(knowledge).toContainText("2.5");
    await expect(knowledge).toContainText("+1.5");
    await expect(knowledge).toContainText("2 improved · 0 same · 0 declined");
    await expect(knowledge).toContainText("Paired t-test on 2 matched participants");

    const download = page.waitForEvent("download");
    await page.getByRole("link", { name: "Download CSV" }).click();
    const csv = await (await download).createReadStream().then(async (stream) => {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) chunks.push(chunk as Buffer);
      return Buffer.concat(chunks).toString("utf8");
    });
    expect(csv).toContain(KNOWLEDGE);
    expect(csv).toContain('"Before","P-001"');
    expect(csv.split("\r\n").filter(Boolean)).toHaveLength(5);
  });
});
