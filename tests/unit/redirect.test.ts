import { describe, expect, it } from "vitest";
import { safeRedirectPath } from "@/lib/auth/redirect";

const site = "https://satis.example";

describe("safeRedirectPath", () => {
  it.each([
    ["/dashboard", "/dashboard"],
    ["/en/dashboard?tab=1", "/en/dashboard?tab=1"],
    ["https://satis.example/en/dashboard", "/en/dashboard"],
  ])("keeps same-origin target %s", (input, expected) => {
    expect(safeRedirectPath(input, site)).toBe(expected);
  });

  it.each([
    "https://evil.example/",
    "//evil.example/path",
    "/\\evil.example",
    "javascript:alert(1)",
    "evil.example",
    "",
    null,
    undefined,
  ])("rejects %s", (input) => {
    expect(safeRedirectPath(input, site)).toBeNull();
  });
});
