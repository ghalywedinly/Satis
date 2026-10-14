import { describe, expect, it } from "vitest";
import { isGuestOnlyPath, isProtectedPath } from "@/lib/auth/routes";

describe("route rules", () => {
  it("protects the app area and its sub-pages only", () => {
    expect(isProtectedPath("/dashboard")).toBe(true);
    expect(isProtectedPath("/dashboard/surveys")).toBe(true);
    expect(isProtectedPath("/dashboards")).toBe(false);
    expect(isProtectedPath("/")).toBe(false);
  });

  it("knows the signed-out-only pages", () => {
    expect(isGuestOnlyPath("/login")).toBe(true);
    expect(isGuestOnlyPath("/reset-password")).toBe(false);
  });
});
