import "server-only";
import { render } from "@react-email/render";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import { ActionEmail } from "./templates/action-email";
import type { EmailMessage } from "./provider";

export type AuthEmailKind = "signup" | "recovery" | "emailChange" | "magicLink" | "reauthentication";

/** Builds a localized auth email. `url` for link emails, `code` for reauthentication. */
export async function buildAuthEmail(
  kind: AuthEmailKind,
  locale: Locale,
  to: string,
  target: { url: string } | { code: string },
): Promise<EmailMessage> {
  const t = await getTranslations({ locale, namespace: "emails" });
  const tc = await getTranslations({ locale, namespace: "common" });

  const action =
    kind === "reauthentication" || !("url" in target)
      ? { kind: "code" as const, code: "code" in target ? target.code : "" }
      : { kind: "link" as const, label: t(`${kind}.button`), url: target.url, fallbackLabel: t("linkFallback") };

  const element = (
    <ActionEmail
      locale={locale}
      appName={tc("appName")}
      heading={t(`${kind}.heading`)}
      body={t(`${kind}.body`)}
      action={action}
      footer={t("footer")}
    />
  );

  return {
    to,
    locale,
    subject: t(`${kind}.subject`),
    html: await render(element),
    text: await render(element, { plainText: true }),
  };
}
