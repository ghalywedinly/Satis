import { Body, Button, Column, Container, Head, Html, Img, Link, Preview, Row, Section, Text } from "@react-email/components";
import { publicEnv } from "@/lib/env/public";

/** Brand colours for email. Clients don't support CSS variables, so the hex values live here. */
export const emailColors = {
  ink: "#0B0D12",
  sand: "#FAF8F4",
  ultramarine: "#2B3AF3",
  ember: "#FF6B4A",
  zest: "#FFCF28",
  muted: "#5A606E",
  border: "#ECE8E1",
  rule: "#F1EEE8",
  quote: "#F6F3EE",
  mint: "#0A6F45",
  emberText: "#A8321F",
  inkMuted: "#B9BDC8",
  inkSoft: "#D6D8DE",
  body: "#2A2E38",
} as const;

export type EmailLocale = "ar" | "en";

/**
 * Brand fonts where the client loads them (Apple Mail, iOS); Gmail and Outlook fall back to the
 * closest system font. Arabic uses Readex Pro / Tahoma, Latin Instrument Sans / Arial.
 */
export const emailFont = (locale: EmailLocale) =>
  locale === "ar" ? "'Readex Pro', Tahoma, 'Segoe UI', Arial, sans-serif" : "'Instrument Sans', -apple-system, 'Segoe UI', Arial, sans-serif";

/** Images (the mark and the slices) are hosted on the site: email clients block inline SVG and clip-path. */
const asset = (name: string) => new URL(`/email/${name}`, publicEnv.NEXT_PUBLIC_SITE_URL).toString();

export type EmailFrameProps = {
  locale: EmailLocale;
  appName: string;
  /** Brand line under the card ("Satisfaction, measured."). */
  tagline: string;
  preview: string;
  /** Small pill in the header, e.g. "For the team". */
  badge?: string;
  /** Why the recipient got this email, plus an optional link (settings, site). */
  footer: { text: string; link?: { label: string; url: string } };
  children: React.ReactNode;
};

/**
 * The shared Satis email: an Ink header with the mark and slices, a white card, and a footer with
 * the speed lines and the tagline. Direction is set on the content itself because Gmail and
 * Outlook drop it from <html> and <body>.
 */
export function EmailFrame({ locale, appName, tagline, preview, badge, footer, children }: EmailFrameProps) {
  const rtl = locale === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const start = rtl ? "right" : "left";
  const end = rtl ? "left" : "right";

  return (
    <Html lang={locale} dir={dir}>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: emailColors.sand, fontFamily: emailFont(locale), margin: 0, padding: "32px 0" }}>
        <Container dir={dir} style={{ maxWidth: 560, margin: "0 auto", padding: "0 16px", direction: dir }}>
          <Section style={{ backgroundColor: emailColors.ink, borderRadius: "20px 20px 0 0", padding: "18px 24px" }}>
            <Row dir={dir}>
              <Column style={{ textAlign: start, verticalAlign: "middle" }}>
                <Img src={asset("mark.png")} width="28" height="26" alt="" style={{ display: "inline-block", verticalAlign: "middle" }} />
                <span style={{ display: "inline-block", verticalAlign: "middle", color: emailColors.sand, fontSize: 20, fontWeight: 700, padding: "0 10px" }}>
                  {appName}
                </span>
              </Column>
              <Column style={{ textAlign: end, verticalAlign: "middle" }}>
                {badge ? (
                  <span style={{ backgroundColor: emailColors.sand, color: emailColors.ink, borderRadius: 999, padding: "4px 10px", fontSize: 12, fontWeight: 700 }}>
                    {badge}
                  </span>
                ) : (
                  <Img src={asset("slices.png")} width="120" height="40" alt="" style={{ display: "inline-block" }} />
                )}
              </Column>
            </Row>
          </Section>

          <Section
            style={{
              backgroundColor: "#FFFFFF",
              border: `1px solid ${emailColors.border}`,
              borderTop: "0",
              borderRadius: "0 0 20px 20px",
              padding: "32px 28px",
              textAlign: start,
            }}
          >
            {children}
          </Section>

          <Section style={{ padding: "24px 8px 0", textAlign: start }}>
            <Img src={asset("speed-lines.png")} width="72" height="6" alt="" />
            <Text style={{ fontSize: 15, fontWeight: 700, color: emailColors.ink, margin: "12px 0 4px" }}>{tagline}</Text>
            <Text style={{ fontSize: 12, lineHeight: "1.7", color: emailColors.muted, margin: 0 }}>
              {footer.text}
              {footer.link ? (
                <>
                  {" "}
                  <Link href={footer.link.url} style={{ color: emailColors.ultramarine }}>
                    {footer.link.label}
                  </Link>
                </>
              ) : null}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** Primary (Ultramarine) or secondary (outlined) button. Buttons are full width on phones by nature of the card. */
export function EmailButton({ href, label, variant = "primary" }: { href: string; label: string; variant?: "primary" | "secondary" }) {
  const primary = variant === "primary";
  return (
    <Button
      href={href}
      style={{
        backgroundColor: primary ? emailColors.ultramarine : "#FFFFFF",
        color: primary ? "#FFFFFF" : emailColors.ink,
        border: primary ? "0" : `1px solid ${emailColors.ink}`,
        borderRadius: 10,
        padding: "15px 24px",
        fontSize: 16,
        fontWeight: 600,
        textDecoration: "none",
        display: "block",
        textAlign: "center",
      }}
    >
      {label}
    </Button>
  );
}
