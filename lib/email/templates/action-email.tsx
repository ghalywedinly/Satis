import { Body, Button, Container, Head, Heading, Html, Link, Preview, Section, Text } from "@react-email/components";

export type ActionEmailProps = {
  locale: "ar" | "en";
  appName: string;
  heading: string;
  body: string;
  /** Either a button with a link, or a one-time code. */
  action: { kind: "link"; label: string; url: string; fallbackLabel: string } | { kind: "code"; code: string };
  footer: string;
};

const colors = { ink: "#0B0D12", sand: "#FAF8F4", ultramarine: "#2B3AF3", muted: "#5A606E", border: "#E6E2DA" };

/** Single-action transactional email (verify, reset, confirm). Direction and fonts follow the locale. */
export function ActionEmail({ locale, appName, heading, body, action, footer }: ActionEmailProps) {
  const rtl = locale === "ar";
  const font = rtl
    ? "'Readex Pro', Tahoma, 'Segoe UI', Arial, sans-serif"
    : "'Instrument Sans', -apple-system, 'Segoe UI', Arial, sans-serif";
  const align = rtl ? "right" : "left";

  return (
    <Html lang={locale} dir={rtl ? "rtl" : "ltr"}>
      <Head />
      <Preview>{heading}</Preview>
      <Body style={{ backgroundColor: colors.sand, fontFamily: font, margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 520, margin: "0 auto", padding: "0 16px" }}>
          <Text style={{ fontSize: 20, fontWeight: 700, color: colors.ink, margin: "0 0 24px", textAlign: align }}>{appName}</Text>
          <Section
            style={{ backgroundColor: "#FFFFFF", border: `1px solid ${colors.border}`, borderRadius: 20, padding: 32, textAlign: align }}
          >
            <Heading as="h1" style={{ fontSize: 24, lineHeight: "1.3", color: colors.ink, margin: "0 0 12px" }}>
              {heading}
            </Heading>
            <Text style={{ fontSize: 16, lineHeight: "1.6", color: colors.ink, margin: "0 0 24px" }}>{body}</Text>
            {action.kind === "link" ? (
              <>
                <Button
                  href={action.url}
                  style={{
                    backgroundColor: colors.ultramarine,
                    color: "#FFFFFF",
                    borderRadius: 10,
                    padding: "14px 24px",
                    fontSize: 15,
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  {action.label}
                </Button>
                <Text style={{ fontSize: 13, color: colors.muted, margin: "24px 0 4px" }}>{action.fallbackLabel}</Text>
                <Link href={action.url} dir="ltr" style={{ fontSize: 13, color: colors.ultramarine, wordBreak: "break-all" }}>
                  {action.url}
                </Link>
              </>
            ) : (
              <Text dir="ltr" style={{ fontSize: 32, fontWeight: 700, letterSpacing: 6, color: colors.ink, margin: 0, textAlign: align }}>
                {action.code}
              </Text>
            )}
          </Section>
          <Text style={{ fontSize: 12, color: colors.muted, margin: "24px 0 0", textAlign: align }}>{footer}</Text>
        </Container>
      </Body>
    </Html>
  );
}
