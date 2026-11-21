import { Column, Heading, Row, Section, Text } from "@react-email/components";
import { EmailButton, emailColors, EmailFrame } from "./frame";

export type Stat = { label: string; value: string; /** For emails, phone numbers and codes inside Arabic. */ ltr?: boolean; change?: { text: string; tone: "good" | "bad" | "neutral" } };

export type NotificationEmailProps = {
  locale: "ar" | "en";
  appName: string;
  /** Brand line in the footer ("Satisfaction, measured."). */
  tagline: string;
  /** Small label above the heading, e.g. the business name. */
  eyebrow: string;
  heading: string;
  /** Alerts colour the eyebrow Ember; reports use Ultramarine. */
  tone: "alert" | "report";
  lines: string[];
  /** Pill in the header, e.g. "For the team". */
  badge?: string;
  /** The one thing that matters most (a meeting time), on an Ink block. */
  highlight?: { label: string; value: string; detail?: string };
  /** A headline score on a Zest plate (top scores only: Zest is the delight colour). */
  score?: { value: string; label: string; change?: Stat["change"] };
  stats?: Stat[];
  /** A customer's words or an AI summary, shown as a quote block. */
  quote?: { label: string; text: string };
  action: { label: string; url: string };
  secondaryAction?: { label: string; url: string };
  footer: { text: string; linkLabel: string; url: string };
};

const changeColor = (tone: "good" | "bad" | "neutral") =>
  tone === "good" ? emailColors.mint : tone === "bad" ? emailColors.emberText : emailColors.muted;

/** Alerts and reports for business teams and the Satis team. Direction follows the recipient's language. */
export function NotificationEmail(props: NotificationEmailProps) {
  const { locale, appName, tagline, eyebrow, heading, tone, lines, badge, highlight, score, stats, quote, action, secondaryAction, footer } = props;
  const rtl = locale === "ar";
  const dir = rtl ? "rtl" : "ltr";
  const start = rtl ? "right" : "left";

  return (
    <EmailFrame
      locale={locale}
      appName={appName}
      tagline={tagline}
      preview={heading}
      badge={badge}
      footer={{ text: footer.text, link: { label: footer.linkLabel, url: footer.url } }}
    >
      <Text style={{ fontSize: 13, fontWeight: 700, color: tone === "alert" ? emailColors.emberText : emailColors.ultramarine, margin: "0 0 8px" }}>{eyebrow}</Text>
      <Heading as="h1" style={{ fontSize: 26, lineHeight: "1.4", fontWeight: 700, color: emailColors.ink, margin: "0 0 14px" }}>
        {heading}
      </Heading>
      {lines.map((line) => (
        <Text key={line} style={{ fontSize: 16, lineHeight: "1.75", color: emailColors.body, margin: "0 0 8px" }}>
          {line}
        </Text>
      ))}

      {score && (
        <Section style={{ margin: "20px 0 4px" }}>
          <Row dir={dir}>
            <Column style={{ width: 1, whiteSpace: "nowrap", verticalAlign: "middle" }}>
              <span dir="ltr" style={{ display: "inline-block", backgroundColor: emailColors.zest, color: emailColors.ink, fontSize: 40, fontWeight: 800, padding: "4px 18px", borderRadius: 6 }}>
                {score.value}
              </span>
            </Column>
            <Column style={{ verticalAlign: "middle", padding: "0 14px", textAlign: start }}>
              <Text style={{ fontSize: 15, fontWeight: 600, color: emailColors.ink, margin: 0 }}>{score.label}</Text>
              {score.change && <Text style={{ fontSize: 14, fontWeight: 600, color: changeColor(score.change.tone), margin: "2px 0 0" }}>{score.change.text}</Text>}
            </Column>
          </Row>
        </Section>
      )}

      {highlight && (
        <Section style={{ backgroundColor: emailColors.ink, borderRadius: 16, padding: "18px 20px", margin: "20px 0 4px" }}>
          <Text style={{ fontSize: 13, color: emailColors.inkMuted, margin: "0 0 2px" }}>{highlight.label}</Text>
          <Text style={{ fontSize: 22, lineHeight: "1.45", fontWeight: 700, color: emailColors.sand, margin: 0 }}>{highlight.value}</Text>
          {highlight.detail && <Text style={{ fontSize: 15, color: emailColors.inkSoft, margin: "4px 0 0" }}>{highlight.detail}</Text>}
        </Section>
      )}

      {stats && stats.length > 0 && (
        <Section style={{ margin: "16px 0 4px" }}>
          {stats.map((stat) => (
            <Row key={stat.label} dir={dir} style={{ borderBottom: `1px solid ${emailColors.rule}` }}>
              {/* Fixed widths and inner spacing keep label and value apart even where a client ignores direction. */}
              <Column
                width="38%"
                style={{ width: "38%", padding: "12px 0", ...(rtl ? { paddingLeft: 12 } : { paddingRight: 12 }), fontSize: 14, color: emailColors.muted, textAlign: start }}
              >
                {stat.label}
              </Column>
              <Column width="62%" style={{ width: "62%", padding: "12px 0", fontSize: 15, fontWeight: 600, color: emailColors.ink, textAlign: start }}>
                {stat.ltr ? <span dir="ltr">{stat.value}</span> : stat.value}
                {stat.change && (
                  <span style={{ fontSize: 12, fontWeight: 600, padding: "0 8px", color: changeColor(stat.change.tone) }}>{stat.change.text}</span>
                )}
              </Column>
            </Row>
          ))}
        </Section>
      )}

      {quote && (
        <Section style={{ backgroundColor: emailColors.quote, borderRadius: 14, padding: "14px 16px", margin: "20px 0 4px" }}>
          <Text style={{ fontSize: 13, fontWeight: 700, color: emailColors.ink, margin: "0 0 4px" }}>{quote.label}</Text>
          <Text dir="auto" style={{ fontSize: 15, lineHeight: "1.7", color: emailColors.body, margin: 0 }}>
            {quote.text}
          </Text>
        </Section>
      )}

      <Section style={{ marginTop: 24 }}>
        <EmailButton href={action.url} label={action.label} />
        {secondaryAction && (
          <Section style={{ marginTop: 10 }}>
            <EmailButton href={secondaryAction.url} label={secondaryAction.label} variant="secondary" />
          </Section>
        )}
      </Section>
    </EmailFrame>
  );
}
