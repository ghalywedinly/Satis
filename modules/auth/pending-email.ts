import "server-only";
import { cookies } from "next/headers";

/** Short-lived cookie that lets the "check your email" page show the address without putting it in the URL. */
const PENDING_EMAIL_COOKIE = "satis_pending_email";

export async function setPendingEmail(email: string) {
  (await cookies()).set(PENDING_EMAIL_COOKIE, email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 30,
    path: "/",
  });
}

export async function getPendingEmail() {
  return (await cookies()).get(PENDING_EMAIL_COOKIE)?.value ?? null;
}
