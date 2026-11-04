import "server-only";
import { render } from "@react-email/render";
import { getTranslations } from "next-intl/server";
import { publicEnv } from "@/lib/env/public";
import { serverEnv } from "@/lib/env/server";
import { getEmailProvider } from "@/lib/email/provider";
import { NotificationEmail, type NotificationEmailProps } from "@/lib/email/templates/notification-email";
import { formatCount, formatDate } from "@/lib/i18n/format";
import { getPathname } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { reportError } from "@/lib/observability/errors";
import { googleCalendarUrl, MEETING_MINUTES } from "./slots";

export type Booking = { startsAt: string; fullName: string; email: string; phone: string; company: string; locale: Locale };

/** The team reads booking emails in Arabic, the product's primary language. */
const TEAM_LOCALE: Locale = "ar";

const when = (locale: Locale, iso: string) =>
  formatDate(locale, iso, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });

async function send(to: string, locale: Locale, subject: string, props: NotificationEmailProps) {
  const element = <NotificationEmail {...props} />;
  await getEmailProvider().send({ to, locale, subject, html: await render(element), text: await render(element, { plainText: true }) });
}

/** Confirms the meeting to the visitor and tells the team. Failures are reported, never thrown. */
export async function sendBookingEmails(booking: Booking): Promise<void> {
  const site = publicEnv.NEXT_PUBLIC_SITE_URL;
  const tasks: Promise<void>[] = [];

  tasks.push(
    (async () => {
      const { locale } = booking;
      const [t, tc, tb] = await Promise.all([
        getTranslations({ locale, namespace: "emails.booking.visitor" }),
        getTranslations({ locale, namespace: "common" }),
        getTranslations({ locale, namespace: "booking.success" }),
      ]);
      const minutes = formatCount(locale, MEETING_MINUTES);
      await send(booking.email, locale, t("subject", { date: when(locale, booking.startsAt) }), {
        locale,
        appName: tc("appName"),
        eyebrow: t("eyebrow"),
        heading: t("heading", { name: booking.fullName }),
        tone: "report",
        lines: [t("intro"), t("link")],
        stats: [
          { label: t("when"), value: when(locale, booking.startsAt) },
          { label: t("length"), value: t("lengthValue", { minutes }) },
          { label: t("company"), value: booking.company },
        ],
        action: { label: t("button"), url: googleCalendarUrl(booking.startsAt, tb("calendarTitle"), tb("calendarDetails", { minutes })) },
        footer: { text: t("footer"), linkLabel: new URL(site).host, url: new URL(getPathname({ locale, href: "/" }), site).toString() },
      });
    })(),
  );

  const teamAddress = serverEnv.BOOKING_NOTIFY_EMAIL;
  if (teamAddress) {
    tasks.push(
      (async () => {
        const locale = TEAM_LOCALE;
        const [t, tc] = await Promise.all([getTranslations({ locale, namespace: "emails.booking.team" }), getTranslations({ locale, namespace: "common" })]);
        const date = when(locale, booking.startsAt);
        await send(teamAddress, locale, t("subject", { company: booking.company, date }), {
          locale,
          appName: tc("appName"),
          eyebrow: t("eyebrow"),
          heading: t("heading", { name: booking.fullName }),
          tone: "report",
          lines: [t("intro")],
          stats: [
            { label: t("when"), value: date },
            { label: t("name"), value: booking.fullName },
            { label: t("company"), value: booking.company },
            { label: t("email"), value: booking.email, ltr: true },
            { label: t("phone"), value: booking.phone, ltr: true },
            { label: t("language"), value: t(`languages.${booking.locale}`) },
          ],
          action: {
            label: t("button"),
            url: googleCalendarUrl(booking.startsAt, t("calendarTitle", { company: booking.company }), `${booking.fullName} · ${booking.email} · ${booking.phone}`),
          },
          footer: { text: t("footer"), linkLabel: new URL(site).host, url: site },
        });
      })(),
    );
  }

  for (const result of await Promise.allSettled(tasks)) {
    if (result.status === "rejected") reportError(result.reason, { area: "meetings", action: "booking-email" });
  }
}
