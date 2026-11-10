import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarPlus, ChevronLeft, Mail, MessageCircle, Phone, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { ConfirmAction } from "@/components/forms/confirm-action";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { setBookingStatus } from "@/modules/bookings/actions";
import { BookingForm } from "@/modules/bookings/components/booking-form";
import { calendarLink, weekStart, whatsappLink } from "@/modules/bookings/definition";
import { getBooking } from "@/modules/bookings/queries";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/bookings/[bookingId]">): Promise<Metadata> {
  const { bookingId } = await params;
  const booking = await getBooking(bookingId);
  return { title: booking?.full_name, robots: { index: false } };
}

const STATUS_CHIP = {
  new: "bg-ultra-50 text-ultramarine",
  confirmed: "bg-mint-50 text-mint-700",
  held: "bg-sand-100 text-ink-700",
  customer: "bg-mint-50 text-mint-700",
  not_now: "bg-sand-100 text-ink-600",
  cancelled: "bg-ember-50 text-ember-700",
} as const;

export default async function BookingPage({ params }: PageProps<"/[locale]/admin/bookings/[bookingId]">) {
  const locale = await resolveLocale(params);
  const { bookingId } = await params;
  const booking = await getBooking(bookingId);
  if (!booking) notFound();
  const t = await getTranslations({ locale, namespace: "admin" });

  const when = formatDate(locale, booking.starts_at, { weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit" });
  const firstName = booking.full_name.split(/\s+/)[0];
  const contact = [
    { href: `tel:${booking.phone}`, label: t("details.call"), icon: Phone, external: false },
    { href: whatsappLink(booking.phone, t("details.whatsappHello", { name: firstName, when })), label: t("details.whatsapp"), icon: MessageCircle, external: true },
    { href: `mailto:${booking.email}`, label: t("details.emailAction"), icon: Mail, external: false },
  ];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-8">
      <Link
        href={`/admin/bookings?week=${weekStart(new Date(booking.starts_at))}`}
        className="flex items-center gap-1 self-start rounded-control text-sm font-semibold text-muted-foreground outline-none hover:text-ink focus-visible:shadow-focus"
      >
        <ChevronLeft aria-hidden strokeWidth={1.75} className="size-4 rtl:-scale-x-100" />
        {t("details.back")}
      </Link>

      <section className="flex flex-col gap-6 rounded-card border border-border bg-white p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className="eyebrow">{when}</span>
            <h1 className="text-3xl font-extrabold tracking-[-0.03em]">{booking.full_name}</h1>
            <span className="text-muted-foreground">
              {booking.company} · {t(`details.languages.${booking.locale}`)}
            </span>
          </div>
          <span className={cn("rounded-full px-3 py-1 text-xs font-bold", STATUS_CHIP[booking.status])}>{t(`statuses.${booking.status}`)}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {contact.map(({ href, label, icon: Icon, external }) => (
            <Button key={label} asChild variant="outline" className="h-11">
              <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                <Icon aria-hidden strokeWidth={1.75} />
                {label}
              </a>
            </Button>
          ))}
        </div>

        <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-2.5 border-t border-sand-100 pt-5 text-sm">
          <dt className="text-muted-foreground">{t("details.email")}</dt>
          <dd>
            <bdi dir="ltr" className="font-medium">
              {booking.email}
            </bdi>
          </dd>
          <dt className="text-muted-foreground">{t("details.mobile")}</dt>
          <dd>
            <bdi dir="ltr" className="font-medium">
              {booking.phone}
            </bdi>
          </dd>
          <dt className="text-muted-foreground">{t("details.language")}</dt>
          <dd className="font-medium">{t(`details.languages.${booking.locale}`)}</dd>
        </dl>
        <p className="-mt-3 text-sm text-muted-foreground">
          {t("details.booked", { when: formatDate(locale, booking.created_at, { day: "numeric", month: "long", hour: "numeric", minute: "2-digit" }) })}
        </p>

        <div className="border-t border-sand-100 pt-5">
          {/* Remount when the status changes elsewhere (Cancel below), so the form shows it. */}
          <BookingForm key={booking.status} booking={booking} when={when} />
        </div>

        <div className="flex flex-wrap gap-2 border-t border-sand-100 pt-5">
          <Button asChild variant="outline">
            <a href={calendarLink(booking, t("details.calendarTitle", { company: booking.company }))} target="_blank" rel="noopener noreferrer">
              <CalendarPlus aria-hidden strokeWidth={1.75} />
              {t("details.calendar")}
            </a>
          </Button>
          {booking.status !== "cancelled" && (
            <ConfirmAction
              trigger={
                <Button variant="ghost" className="ms-auto text-ember-700 hover:bg-ember-50 hover:text-ember-700">
                  <XCircle aria-hidden strokeWidth={1.75} />
                  {t("details.cancel")}
                </Button>
              }
              title={t("details.cancelTitle")}
              description={t("details.cancelBody", { name: booking.full_name })}
              confirmLabel={t("details.cancelConfirm")}
              cancelLabel={t("details.keep")}
              destructive
              onConfirm={setBookingStatus.bind(null, locale, booking.id, "cancelled")}
            />
          )}
        </div>
      </section>
    </div>
  );
}
