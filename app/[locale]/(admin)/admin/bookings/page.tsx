import type { Metadata } from "next";
import { ChevronLeft, ChevronRight, MessageCircle, Video } from "lucide-react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { formatCount, formatDate } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { resolveLocale } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";
import { StatusButton } from "@/modules/bookings/components/status-button";
import { addDays, gridPosition, isUpcoming, riyadhMidnight, weekStart, whatsappLink, type Booking } from "@/modules/bookings/definition";
import { activeBookings, bookingsInWeek } from "@/modules/bookings/queries";
import { riyadhDate } from "@/modules/meetings/slots";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/bookings">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "admin" });
  return { title: t("metaTitle"), robots: { index: false } };
}

const HOURS = [10, 11, 12, 13, 14, 15, 16];
/** Block colours by status: new ones need attention, confirmed are calm, the rest are done. */
const BLOCK: Record<Booking["status"], string> = {
  new: "bg-ultramarine text-white border-s-4 border-ultra-700",
  confirmed: "bg-mint-50 text-mint-700 border-s-4 border-mint-600",
  held: "bg-sand-100 text-ink-700 border-s-4 border-ink-400",
  customer: "bg-sand-100 text-ink-700 border-s-4 border-mint-600",
  not_now: "bg-sand-100 text-ink-500 border-s-4 border-ink-300",
  cancelled: "hidden",
};

export default async function BookingsWeekPage({ params, searchParams }: PageProps<"/[locale]/admin/bookings">) {
  const locale = await resolveLocale(params);
  await connection();
  const t = await getTranslations({ locale, namespace: "admin" });
  const { week } = await searchParams;
  const now = new Date();
  const sunday = typeof week === "string" && /^\d{4}-\d{2}-\d{2}$/.test(week) ? weekStart(riyadhMidnight(week)) : weekStart(now);
  const today = riyadhDate(now);

  const [weekBookings, active] = await Promise.all([bookingsInWeek(sunday), activeBookings(now)]);
  const live = weekBookings.filter((b) => b.status !== "cancelled");
  const upcoming = active.filter((b) => isUpcoming(b, now) && (b.status === "new" || b.status === "confirmed"));
  const next = upcoming[0];
  const needsReply = upcoming.filter((b) => b.status === "new");

  const day = (offset: number) => riyadhMidnight(addDays(sunday, offset));
  const dateLabel = (offset: number, options: Intl.DateTimeFormatOptions) => formatDate(locale, new Date(day(offset).getTime() + 12 * 3600 * 1000), options);
  const time = (iso: string) => formatDate(locale, iso, { hour: "numeric", minute: "2-digit" });
  const minutesToNext = next ? Math.round((new Date(next.starts_at).getTime() - now.getTime()) / 60000) : 0;
  const whenNext = next
    ? minutesToNext <= 0
      ? t("upNext.now")
      : minutesToNext < 60
        ? t("upNext.in", { time: t("duration", { minutes: formatCount(locale, minutesToNext) }) })
        : formatDate(locale, next.starts_at, { weekday: "long", hour: "numeric", minute: "2-digit" })
    : "";

  return (
    <div className="flex flex-col">
      <section className="relative overflow-hidden bg-ink text-sand">
        <svg aria-hidden viewBox="0 0 420 200" className="pointer-events-none absolute -end-10 -top-8 hidden h-[200px] w-[420px] opacity-90 md:block rtl:-scale-x-100">
          <polygon points="140,20 420,20 330,90 50,90" fill="#2B3AF3" />
          <polygon points="60,110 340,110 250,180 -30,180" fill="#FF6B4A" />
        </svg>
        <div className="relative mx-auto flex w-full max-w-[1440px] flex-wrap items-end gap-6 px-4 pt-6 pb-8 sm:px-8">
          <div className="flex flex-col gap-2">
            <h1 className="text-[clamp(32px,4vw,46px)] leading-none font-extrabold tracking-[-0.04em] text-sand">
              {t("week.title", { count: formatCount(locale, live.length) })}
            </h1>
            <p className="text-ink-200">{t("week.range", { from: dateLabel(0, { day: "numeric", month: "long" }), to: dateLabel(4, { day: "numeric", month: "long" }) })}</p>
          </div>
          <div className="flex gap-2 md:me-[260px]">
            <Button asChild variant="outline" size="icon" className="border-ink-600 bg-transparent text-sand hover:bg-ink-800 hover:text-sand">
              <Link href={`/admin/bookings?week=${addDays(sunday, -7)}`} aria-label={t("week.previous")}>
                <ChevronLeft aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="border-ink-600 bg-transparent text-sand hover:bg-ink-800 hover:text-sand">
              <Link href="/admin/bookings">{t("week.thisWeek")}</Link>
            </Button>
            <Button asChild variant="outline" size="icon" className="border-ink-600 bg-transparent text-sand hover:bg-ink-800 hover:text-sand">
              <Link href={`/admin/bookings?week=${addDays(sunday, 7)}`} aria-label={t("week.next")}>
                <ChevronRight aria-hidden strokeWidth={1.75} className="rtl:-scale-x-100" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-[1440px] gap-6 px-4 py-6 sm:px-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section aria-label={t("week.calendar")} className="overflow-x-auto rounded-card border border-border bg-white p-4">
          <div className="grid min-w-[720px] grid-cols-[52px_repeat(5,minmax(0,1fr))] grid-rows-[52px_repeat(14,40px)] gap-x-2">
            {[0, 1, 2, 3, 4].map((offset) => {
              const isToday = addDays(sunday, offset) === today;
              return (
                <div key={offset} className="row-start-1 flex flex-col justify-center border-b border-border ps-1" style={{ gridColumn: offset + 2 }}>
                  <span className={cn("text-xs font-semibold", isToday ? "text-ember-700" : "text-muted-foreground")}>
                    {isToday ? t("week.today") : dateLabel(offset, { weekday: "short" })}
                  </span>
                  <span className={cn("font-display text-xl font-extrabold tracking-[-0.02em]", isToday && "text-ember-700")}>{dateLabel(offset, { day: "numeric" })}</span>
                </div>
              );
            })}
            {HOURS.map((hour, i) => (
              <div key={hour} className="contents">
                <div className="col-start-1 pt-0.5 text-xs text-muted-foreground tabular" style={{ gridRow: `${i * 2 + 2} / span 2` }}>
                  {formatDate(locale, new Date(day(0).getTime() + hour * 3600 * 1000), { hour: "numeric", minute: "2-digit" })}
                </div>
                <div className="col-start-2 col-end-7 border-t border-sand-100" style={{ gridRow: `${i * 2 + 2} / span 2` }} />
              </div>
            ))}
            {live.map((booking) => {
              const { day: weekday, slot } = gridPosition(booking.starts_at);
              if (weekday > 4 || slot < 0 || slot > 13) return null;
              return (
                <Link
                  key={booking.id}
                  href={`/admin/bookings/${booking.id}`}
                  className={cn(
                    "my-[3px] flex min-w-0 flex-col justify-center rounded-[10px] px-2.5 outline-none transition-transform duration-[140ms] hover:-translate-y-px focus-visible:shadow-focus",
                    BLOCK[booking.status],
                    next?.id === booking.id && "ring-2 ring-zest",
                  )}
                  style={{ gridColumn: weekday + 2, gridRow: slot + 2 }}
                >
                  <span className="truncate text-[13px] font-bold">
                    {time(booking.starts_at)} · {booking.full_name}
                  </span>
                  <span className="truncate text-xs opacity-85">{booking.company}</span>
                </Link>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-2 pt-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] bg-ultramarine" />
              {t("week.legendNew")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] border border-mint-600 bg-mint-50" />
              {t("week.legendConfirmed")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-[3px] border border-ink-400 bg-sand-100" />
              {t("week.legendDone")}
            </span>
            <span className="ms-auto">{t("week.legendFree")}</span>
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <section aria-labelledby="up-next" className="flex flex-col gap-3 rounded-card border border-border bg-white p-5">
            <h2 id="up-next" className="eyebrow">
              {t("upNext.title")}
              {next && ` · ${whenNext}`}
            </h2>
            {next ? (
              <>
                <div className="flex items-center gap-3">
                  <span aria-hidden className="slice-sm flex h-12 w-14 shrink-0 items-center justify-center bg-zest font-display text-lg font-extrabold text-ink">
                    {initials(next.full_name)}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <span className="truncate font-display text-xl font-extrabold tracking-[-0.02em]">{next.full_name}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {next.company} · {formatDate(locale, next.starts_at, { weekday: "short", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                {next.meeting_link ? (
                  <Button asChild size="lg" className="h-12">
                    <a href={next.meeting_link} target="_blank" rel="noopener noreferrer">
                      <Video aria-hidden strokeWidth={1.75} />
                      {t("upNext.join")}
                    </a>
                  </Button>
                ) : (
                  <Button asChild size="lg" className="h-12">
                    <Link href={`/admin/bookings/${next.id}`}>{t("upNext.addLink")}</Link>
                  </Button>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Button asChild variant="outline">
                    <a href={whatsappLink(next.phone)} target="_blank" rel="noopener noreferrer">
                      <MessageCircle aria-hidden strokeWidth={1.75} />
                      {t("upNext.whatsapp")}
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/admin/bookings/${next.id}`}>{t("upNext.details")}</Link>
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">{t("upNext.none")}</p>
            )}
          </section>

          <section aria-labelledby="needs-reply" className="flex flex-col rounded-card border border-border bg-white p-5">
            <div className="flex items-center gap-2 pb-2">
              <h2 id="needs-reply" className="text-lg">
                {t("reply.title")}
              </h2>
              {needsReply.length > 0 && (
                <span className="ms-auto rounded-full bg-ultramarine px-2 py-0.5 text-xs font-bold text-white tabular">{formatCount(locale, needsReply.length)}</span>
              )}
            </div>
            {needsReply.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("reply.none")}</p>
            ) : (
              <ul className="flex flex-col divide-y divide-sand-100">
                {needsReply.map((b) => (
                  <li key={b.id} className="flex items-center gap-3 py-3">
                    <Link href={`/admin/bookings/${b.id}`} className="flex min-w-0 flex-1 flex-col rounded-control outline-none hover:underline focus-visible:shadow-focus">
                      <span className="truncate text-sm font-semibold">
                        {b.full_name} · {b.company}
                      </span>
                      <span className="text-xs text-muted-foreground">{formatDate(locale, b.starts_at, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>
                    </Link>
                    <StatusButton bookingId={b.id} status="confirmed" label={t("reply.confirm")} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
