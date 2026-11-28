import { expect, test } from "@playwright/test";

test.describe("landing page", () => {
  test("Arabic landing page: sections, pricing and booking", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "رضا عملائك، بالأرقام.",
    );
    for (const heading of [
      "أغلب العملاء غير الراضين لا يشتكون. يرحلون بصمت.",
      "ساتيس يعطي كل عميل عشر ثوانٍ ليقول رأيه، ويعطيك الصورة كاملة.",
      "قيمة تراها في أسابيع، لا في سنوات",
      "كيف يحل ساتيس مشكلات حقيقية",
      "الختم الأصفر يقول لعملائك الجدد: هذا الرقم حقيقي.",
      "من رمز QR إلى قرار، في أربع خطوات",
      "كل ما تحتاجه لتسمع عملاءك",
      "امسح. أجب. انتهى.",
      "سعر واضح لكل نوع نشاط",
      "أسئلة يطرحها أصحاب الأعمال",
    ]) {
      await expect(
        page.getByRole("heading", { level: 2, name: heading }),
      ).toBeVisible();
    }
    await expect(page.locator("#pricing")).toContainText("149 ر.س");
    // Before and after, and the worked examples.
    await expect(
      page.getByRole("table").getByRole("columnheader", { name: "مع ساتيس" }),
    ).toBeVisible();
    await expect(
      page.getByRole("article", { name: "عيادة أسنان في جدة" }),
    ).toContainText("ماذا كشف ساتيس");
    await page
      .locator("#badge")
      .getByRole("link", { name: "تصفّح تقييم ساتيس" })
      .click();
    await expect(page).toHaveURL(/\/score$/);
    await page.goto("/");
    // FAQ answers open on demand.
    await page.getByText("هل يحتاج عملائي إلى تنزيل تطبيق؟").click();
    await expect(
      page.getByText("لا. يمسح العميل رمز QR بكاميرا الجوال"),
    ).toBeVisible();
    await page
      .locator("main")
      .getByRole("link", { name: "احجز موعدًا" })
      .first()
      .click();
    await expect(page).toHaveURL(/\/book$/);
  });

  test("English landing page links to sections and log in", async ({
    page,
  }) => {
    await page.goto("/en");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.locator("#pricing")).toContainText("SAR 149");
    await page.getByRole("link", { name: "See how it works" }).click();
    await expect(page).toHaveURL(/#how$/);
    await page
      .getByRole("banner")
      .getByRole("link", { name: "Log in" })
      .click();
    await expect(page).toHaveURL(/\/en\/login$/);
  });

  test("pricing page: kinds of business, yearly billing and locations", async ({
    page,
  }) => {
    await page.goto("/");
    await page
      .locator("#pricing")
      .getByRole("link", { name: "شوف كل الباقات" })
      .click();
    await expect(page).toHaveURL(/\/pricing$/);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "أسعار تكبر مع نشاطك.",
    );

    const growth = page.getByRole("article", { name: "النمو" });
    await expect(growth).toContainText("457");
    await growth.getByRole("button", { name: "فرع أكثر" }).click();
    await expect(growth).toContainText("536");

    await page.getByRole("switch", { name: "الدفع سنويًا" }).click();
    await expect(page.getByRole("article", { name: "البداية" })).toContainText(
      "124",
    );

    await page.getByRole("tab", { name: /متاجر إلكترونية/ }).click();
    await expect(page.getByRole("article", { name: "البداية" })).toContainText(
      "للمتاجر الصغيرة",
    );
    await expect(
      page.getByRole("columnheader", { name: "المتاجر الكبيرة" }),
    ).toBeVisible();
  });

  test("pricing page in English", async ({ page }) => {
    await page.goto("/en/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "Pricing that grows with you.",
    );
    await page.getByRole("tab", { name: /Apps and software/ }).click();
    await expect(page.getByRole("article", { name: "Growth" })).toContainText(
      "899",
    );
  });
});
