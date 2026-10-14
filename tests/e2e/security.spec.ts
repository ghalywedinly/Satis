import { expect, test } from "@playwright/test";

test("pages send security headers", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  expect(headers["content-security-policy"]).toContain("object-src 'none'");
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(headers["x-powered-by"]).toBeUndefined();
});

test("pages load without console errors or CSP violations", async ({ page }) => {
  const problems: string[] = [];
  page.on("console", (m) => m.type() === "error" && problems.push(m.text()));
  page.on("pageerror", (e) => problems.push(e.message));
  for (const path of ["/", "/en", "/login", "/en/signup", "/forgot-password"]) {
    await page.goto(path, { waitUntil: "networkidle" });
  }
  expect(problems).toEqual([]);
});

test("the auth email hook rejects unsigned requests", async ({ request }) => {
  const response = await request.post("/api/hooks/auth-email", { data: { user: {}, email_data: {} } });
  expect(response.status()).toBe(401);
});
