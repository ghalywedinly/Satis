import "server-only";
import { render } from "@react-email/render";
import { getTranslations } from "next-intl/server";
import { publicEnv } from "@/lib/env/public";
import { getEmailProvider } from "@/lib/email/provider";
import { NotificationEmail, type NotificationEmailProps } from "@/lib/email/templates/notification-email";
import { getPathname } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { reportError } from "@/lib/observability/errors";

export type Recipient = { user_id: string; email: string; locale: Locale; full_name: string | null };

/** An absolute link into the app, in the recipient's language. */
export const appUrl = (locale: Locale, href: string) =>
  new URL(getPathname({ locale, href: href as never }), publicEnv.NEXT_PUBLIC_SITE_URL).toString();

/** The parts every team email shares: app name and the "why you got this" footer. */
export async function emailFrame(locale: Locale, business: string) {
  const [t, tc] = await Promise.all([getTranslations({ locale, namespace: "emails.notifications" }), getTranslations({ locale, namespace: "common" })]);
  return {
    appName: tc("appName"),
    footer: { text: t("footer", { business }), linkLabel: t("manage"), url: appUrl(locale, "/notifications") },
  };
}

/** Renders and sends one email per recipient. A failed send is reported, never thrown. */
export async function sendEach(recipients: Recipient[], build: (r: Recipient) => Promise<{ subject: string; props: NotificationEmailProps }>, area: string) {
  const provider = getEmailProvider();
  const results = await Promise.allSettled(
    recipients.map(async (recipient) => {
      const { subject, props } = await build(recipient);
      const element = <NotificationEmail {...props} />;
      await provider.send({
        to: recipient.email,
        locale: recipient.locale,
        subject,
        html: await render(element),
        text: await render(element, { plainText: true }),
      });
    }),
  );
  for (const result of results) if (result.status === "rejected") reportError(result.reason, { area: "notifications", action: area });
  return results.filter((r) => r.status === "fulfilled").length;
}
