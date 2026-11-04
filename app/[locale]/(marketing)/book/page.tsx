import type { Metadata } from "next";
import { ArrowLeft, Clock, Globe, Languages, Video } from "lucide-react";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { SatisLogo } from "@/components/brand/satis-mark";
import { SliceHighlight } from "@/components/brand/slice";
import { LanguageSwitcher } from "@/components/language-switcher";
import { formatCount } from "@/lib/i18n/format";
import { Link } from "@/lib/i18n/navigation";
import { isSupabaseConfigured } from "@/lib/env/public";
import { resolveLocale } from "@/lib/i18n/server";
import { reportError } from "@/lib/observability/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { BookingWidget } from "@/modules/meetings/components/booking-widget";
import { bookingDays, bookingWindow, MEETING_MINUTES, riyadhDate } from "@/modules/meetings/slots";

export async function generateMetadata({ params }: PageProps<"/[locale]/book">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "booking" });
  return { title: t("metaTitle") };
}

const AGENDA = ["tour", "setup", "pricing"] as const;

export default async function BookPage({ params }: PageProps<"/[locale]/book">) {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "booking" });
  const minutes = formatCount(locale, MEETING_MINUTES);

  // Times depend on the current moment and on bookings: always render per request.
  await connection();
  const now = new Date();
  const days = bookingDays(now);
  const range = bookingWindow(days);
  let taken: string[] = [];
  if (range && isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("booked_meeting_slots", { p_from: range.from, p_to: range.to });
    // Without the list, every time still shows; the database refuses a taken one on submit.
    if (error) reportError(error, { area: "meetings", action: "slots" });
    taken = (data ?? []).map((iso) => new Date(iso).toISOString());
  }

  const details = [
    { icon: Clock, label: t("details.duration", { minutes }) },
    { icon: Video, label: t("details.where") },
    { icon: Languages, label: t("details.language") },
    { icon: Globe, label: t("details.timezone") },
  ];

  return (
    <div className="grid min-h-[100dvh] grid-cols-[minmax(0,1fr)] bg-sand lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* The pitch, on Ink. Sticks beside the calendar on wide screens. */}
      <aside className="relative overflow-hidden bg-ink text-sand">
        <div className="relative z-10 flex h-full flex-col gap-10 px-4 py-6 sm:px-10 lg:sticky lg:top-0 lg:max-h-[100dvh] lg:px-12 lg:py-10">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" aria-label={t("backHome")} className="group inline-flex items-center gap-3 rounded-control outline-none focus-visible:shadow-focus">
              <ArrowLeft aria-hidden strokeWidth={1.75} className="size-4 text-ink-300 transition-transform duration-[140ms] group-hover:-translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:translate-x-0.5" />
              <SatisLogo size={24} tone="sand-zest" locale={locale} />
            </Link>
            <LanguageSwitcher className="text-sand hover:bg-ink-800 hover:text-sand" />
          </div>

          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-500 lg:mt-6">
            <span className="eyebrow text-ink-300">{t("eyebrow", { minutes })}</span>
            <h1 className="max-w-[14ch] text-[clamp(36px,4.6vw,60px)] leading-[1.04] font-extrabold tracking-[-0.04em]">
              {t.rich("title", { hl: (chunks) => <SliceHighlight tone="ultra" className="px-[0.2em]">{chunks}</SliceHighlight> })}
            </h1>
            <p className="max-w-[44ch] text-base leading-relaxed text-ink-200 sm:text-lg">{t("body")}</p>
          </div>

          <div className="hidden flex-col gap-4 sm:flex">
            <span className="text-sm font-semibold text-ink-300">{t("agendaLabel")}</span>
            <ol className="flex flex-col divide-y divide-ink-700 border-y border-ink-700">
              {AGENDA.map((item, i) => (
                <li key={item} className="flex items-center gap-4 py-3.5">
                  <span className="slice-sm flex h-7 w-10 shrink-0 items-center justify-center bg-ink-800 font-display text-sm font-extrabold text-sand">
                    {formatCount(locale, i + 1)}
                  </span>
                  <span className="text-[15px] text-ink-100">{t(`agenda.${item}`)}</span>
                </li>
              ))}
            </ol>
          </div>

          <ul className="mt-auto grid grid-cols-2 gap-x-6 gap-y-3 text-sm text-ink-200">
            {details.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon aria-hidden strokeWidth={1.75} className="size-4 shrink-0 text-ember" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <main id="content" className="flex items-start justify-center px-4 py-8 sm:px-10 lg:items-center lg:py-14">
        <BookingWidget days={days} taken={taken} today={riyadhDate(now)} />
      </main>
    </div>
  );
}
