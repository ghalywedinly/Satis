/**
 * Returns a same-origin path (with query) that is safe to redirect to, or null.
 * Accepts relative paths or absolute URLs on our own origin; rejects everything else
 * (other hosts, protocol-relative "//", backslash tricks) to prevent open redirects.
 */
export function safeRedirectPath(target: string | null | undefined, siteUrl: string): string | null {
  if (!target) return null;
  try {
    const origin = new URL(siteUrl).origin;
    const url = new URL(target, origin);
    if (url.origin !== origin) return null;
    if (!target.startsWith("/") && !target.startsWith(origin)) return null;
    if (target.startsWith("//") || target.includes("\\")) return null;
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
