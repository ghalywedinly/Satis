import type { OrgRole } from "@/types/database";

/**
 * Who can do what. Mirrors the database rules (RLS policies and functions in
 * supabase/migrations), which are the real enforcement; this decides what the UI offers.
 */
export const ROLES: OrgRole[] = ["owner", "admin", "manager", "staff", "viewer"];

const RANK: Record<OrgRole, number> = { owner: 5, admin: 4, manager: 3, staff: 2, viewer: 1 };

const MINIMUM_ROLE = {
  "organization.edit": "admin",
  "members.manage": "admin",
  "auditLog.read": "admin",
  "locations.manage": "manager",
  "surveys.manage": "manager",
} as const satisfies Record<string, OrgRole>;

export type Permission = keyof typeof MINIMUM_ROLE;

export const atLeast = (role: OrgRole, minimum: OrgRole) => RANK[role] >= RANK[minimum];

export const can = (role: OrgRole, permission: Permission) => atLeast(role, MINIMUM_ROLE[permission]);

/** Roles `caller` may give to someone else. Only owners grant or remove ownership. */
export function assignableRoles(caller: OrgRole): OrgRole[] {
  if (caller === "owner") return ROLES;
  if (caller === "admin") return ROLES.filter((r) => r !== "owner");
  return [];
}

/** Whether `caller` may change or remove a member who currently has `target` role. */
export const canManageMember = (caller: OrgRole, target: OrgRole) =>
  can(caller, "members.manage") && (target !== "owner" || caller === "owner");

/** Roles that can be offered in an invitation (ownership is never granted by invitation). */
export const invitableRoles = (caller: OrgRole) => assignableRoles(caller).filter((r) => r !== "owner");
