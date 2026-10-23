import "server-only";
import { render } from "@react-email/render";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/routing";
import type { OrgRole } from "@/types/database";
import { ActionEmail } from "./templates/action-email";
import type { EmailMessage } from "./provider";

export async function buildInvitationEmail(input: {
  locale: Locale;
  to: string;
  url: string;
  organization: string;
  inviter: string;
  role: OrgRole;
}): Promise<EmailMessage> {
  const t = await getTranslations({ locale: input.locale, namespace: "emails" });
  const tc = await getTranslations({ locale: input.locale, namespace: "common" });
  const tr = await getTranslations({ locale: input.locale, namespace: "organization.roles" });
  const vars = { organization: input.organization, inviter: input.inviter, role: tr(input.role) };

  const element = (
    <ActionEmail
      locale={input.locale}
      appName={tc("appName")}
      heading={t("invitation.heading", vars)}
      body={t("invitation.body", vars)}
      action={{ kind: "link", label: t("invitation.button"), url: input.url, fallbackLabel: t("linkFallback") }}
      footer={t("footer")}
    />
  );
  return {
    to: input.to,
    locale: input.locale,
    subject: t("invitation.subject", vars),
    html: await render(element),
    text: await render(element, { plainText: true }),
  };
}
