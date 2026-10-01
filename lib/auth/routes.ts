/** Paths (without locale prefix) that require a signed-in user. Add new app areas here. */
export const PROTECTED_PREFIXES = ["/dashboard", "/onboarding", "/locations", "/team", "/settings"] as const;

/** Paths only for signed-out visitors; signed-in users are sent to the dashboard. */
export const GUEST_ONLY_PATHS = ["/login", "/signup", "/forgot-password"] as const;

export const HOME_PATH = "/dashboard";

const matchesPrefix = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`);

export const isProtectedPath = (path: string) => PROTECTED_PREFIXES.some((p) => matchesPrefix(path, p));
export const isGuestOnlyPath = (path: string) => GUEST_ONLY_PATHS.some((p) => matchesPrefix(path, p));
