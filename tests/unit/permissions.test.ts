import { describe, expect, it } from "vitest";
import { assignableRoles, can, canManageMember, invitableRoles } from "@/lib/permissions";
import { dbErrorKey } from "@/lib/supabase/errors";

describe("permissions (mirror of the database rules)", () => {
  it("grants by minimum role", () => {
    expect(can("owner", "members.manage")).toBe(true);
    expect(can("admin", "members.manage")).toBe(true);
    expect(can("manager", "members.manage")).toBe(false);
    expect(can("manager", "locations.manage")).toBe(true);
    expect(can("staff", "locations.manage")).toBe(false);
    expect(can("viewer", "organization.edit")).toBe(false);
  });

  it("only owners grant or take away ownership", () => {
    expect(assignableRoles("owner")).toContain("owner");
    expect(assignableRoles("admin")).not.toContain("owner");
    expect(assignableRoles("manager")).toEqual([]);
    expect(canManageMember("admin", "owner")).toBe(false);
    expect(canManageMember("owner", "owner")).toBe(true);
    expect(canManageMember("admin", "staff")).toBe(true);
  });

  it("never invites owners", () => {
    expect(invitableRoles("owner")).not.toContain("owner");
    expect(invitableRoles("viewer")).toEqual([]);
  });
});

describe("dbErrorKey", () => {
  it.each([
    [{ message: "last_owner" }, "lastOwner"],
    [{ message: "email_mismatch" }, "emailMismatch"],
    [{ code: "42501", message: "new row violates row-level security policy" }, "forbidden"],
    [{ message: "something unexpected" }, "generic"],
    [null, "generic"],
  ])("maps %o", (error, key) => {
    expect(dbErrorKey(error)).toBe(key);
  });
});
