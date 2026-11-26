import { Heading, Link, Section, Text } from "@react-email/components";
import { EmailButton, emailColors, EmailFrame } from "./frame";

export type ActionEmailProps = {
  locale: "ar" | "en";
  appName: string;
  /** Brand line in the footer ("Satisfaction, measured."). */
  tagline: string;
  heading: string;
  body: string;
  /** Either a button with a link, or a one-time code. */
  action: { kind: "link"; label: string; url: string; fallbackLabel: string } | { kind: "code"; code: string };
  footer: string;
};

/** Single-action transactional email (verify, reset, confirm, invite). Direction follows the locale. */
export function ActionEmail({ locale, appName, tagline, heading, body, action, footer }: ActionEmailProps) {
  return (
    <EmailFrame locale={locale} appName={appName} tagline={tagline} preview={heading} footer={{ text: footer }}>
      <Heading as="h1" style={{ fontSize: 26, lineHeight: "1.4", fontWeight: 700, color: emailColors.ink, margin: "0 0 14px" }}>
        {heading}
      </Heading>
      <Text style={{ fontSize: 16, lineHeight: "1.75", color: emailColors.body, margin: "0 0 24px" }}>{body}</Text>

      {action.kind === "link" ? (
        <>
          <EmailButton href={action.url} label={action.label} />
          <Section style={{ backgroundColor: emailColors.quote, borderRadius: 14, padding: "14px 16px", marginTop: 20 }}>
            <Text style={{ fontSize: 13, color: emailColors.muted, margin: "0 0 4px" }}>{action.fallbackLabel}</Text>
            <Link href={action.url} dir="ltr" style={{ fontSize: 13, color: emailColors.ultramarine, wordBreak: "break-all" }}>
              {action.url}
            </Link>
          </Section>
        </>
      ) : (
        <Section style={{ backgroundColor: emailColors.quote, border: `1px solid ${emailColors.border}`, borderRadius: 14, padding: "16px 20px", textAlign: "center" }}>
          <Text dir="ltr" style={{ fontSize: 34, fontWeight: 800, letterSpacing: 10, color: emailColors.ink, margin: 0, textAlign: "center" }}>
            {action.code}
          </Text>
        </Section>
      )}
    </EmailFrame>
  );
}
