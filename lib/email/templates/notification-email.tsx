import { Body, Button, Column, Container, Head, Heading, Html, Link, Preview, Row, Section, Text } from "@react-email/components";

export type Stat = { label: string; value: string; change?: { text: string; tone: "good" | "bad" | "neutral" } };

export type NotificationEmailProps = {
  locale: "ar" | "en";
  appName: string;
  /** Small label above the heading, e.g. the business name. */
  eyebrow: string;
  heading: string;
  /** Marks an alert with an Ember bar; reports use Ultramarine. */
  tone: "alert" | "report";
  lines: string[];
  stats?: Stat[];
  /** A customer's words or an AI summary, shown as a quote block. */
  quote?: { label: string; text: string };
  action: { label: string; url: string };
  footer: { text: string; linkLabel: string; url: string };
};

const colors = {
  ink: "#0B0D12",
  sand: "#FAF8F4",
  ultramarine: "#2B3AF3",
  ember: "#FF6B4A",
  muted: "#5A606E",
  border: "#E6E2DA",
  mint: "#0A6F45",
  emberText: "#A8321F",
  quote: "#F2EEE7",
};

/** Alerts and reports for business teams. Direction and fonts follow the recipient's language. */
export function NotificationEmail({ locale, appName, eyebrow, heading, tone, lines, stats, quote, action, footer }: NotificationEmailProps) {
  const rtl = locale === "ar";
  const font = rtl ? "'Readex Pro', Tahoma, 'Segoe UI', Arial, sans-serif" : "'Instrument Sans', -apple-system, 'Segoe UI', Arial, sans-serif";
  const align = rtl ? "right" : "left";
  const accent = tone === "alert" ? colors.ember : colors.ultramarine;

  return (
    <Html lang={locale} dir={rtl ? "rtl" : "ltr"}>
      <Head />
      <Preview>{heading}</Preview>
      <Body style={{ backgroundColor: colors.sand, fontFamily: font, margin: 0, padding: "32px 0" }}>
        <Container style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px" }}>
          <Text style={{ fontSize: 20, fontWeight: 700, color: colors.ink, margin: "0 0 24px", textAlign: align }}>{appName}</Text>
          <Section style={{ backgroundColor: "#FFFFFF", border: `1px solid ${colors.border}`, borderRadius: 20, overflow: "hidden" }}>
            <Section style={{ backgroundColor: accent, height: 6 }} />
            <Section style={{ padding: 32, textAlign: align }}>
              <Text style={{ fontSize: 13, fontWeight: 600, color: colors.muted, margin: "0 0 6px" }}>{eyebrow}</Text>
              <Heading as="h1" style={{ fontSize: 24, lineHeight: "1.3", color: colors.ink, margin: "0 0 16px" }}>
                {heading}
              </Heading>
              {lines.map((line) => (
                <Text key={line} style={{ fontSize: 16, lineHeight: "1.6", color: colors.ink, margin: "0 0 8px" }}>
                  {line}
                </Text>
              ))}

              {stats && stats.length > 0 && (
                <Section style={{ margin: "20px 0 4px" }}>
                  {stats.map((stat) => (
                    <Row key={stat.label} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <Column style={{ padding: "10px 0", fontSize: 14, color: colors.muted, textAlign: align }}>{stat.label}</Column>
                      <Column style={{ padding: "10px 0", fontSize: 16, fontWeight: 700, color: colors.ink, textAlign: rtl ? "left" : "right" }}>
                        {stat.value}
                        {stat.change && (
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              marginInlineStart: 8,
                              color: stat.change.tone === "good" ? colors.mint : stat.change.tone === "bad" ? colors.emberText : colors.muted,
                            }}
                          >
                            {stat.change.text}
                          </span>
                        )}
                      </Column>
                    </Row>
                  ))}
                </Section>
              )}

              {quote && (
                <Section style={{ backgroundColor: colors.quote, borderRadius: 12, padding: "14px 16px", margin: "20px 0 4px" }}>
                  <Text style={{ fontSize: 12, fontWeight: 600, color: colors.muted, margin: "0 0 4px" }}>{quote.label}</Text>
                  <Text dir="auto" style={{ fontSize: 15, lineHeight: "1.6", color: colors.ink, margin: 0 }}>
                    {quote.text}
                  </Text>
                </Section>
              )}

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
                  marginTop: 24,
                }}
              >
                {action.label}
              </Button>
            </Section>
          </Section>
          <Text style={{ fontSize: 12, lineHeight: "1.6", color: colors.muted, margin: "24px 0 0", textAlign: align }}>
            {footer.text}{" "}
            <Link href={footer.url} style={{ color: colors.ultramarine }}>
              {footer.linkLabel}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
