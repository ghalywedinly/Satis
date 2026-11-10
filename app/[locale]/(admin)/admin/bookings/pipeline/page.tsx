import type { Metadata } from "next";
import { connection } from "next/server";
import { getTranslations } from "next-intl/server";
import { formatCount, formatDate, formatPercent } from "@/lib/i18n/format";
import { resolveLocale } from "@/lib/i18n/server";
import { PipelineBoard, type PipelineCard } from "@/modules/bookings/components/pipeline-board";
import { isUpcoming } from "@/modules/bookings/definition";
import { activeBookings } from "@/modules/bookings/queries";
import { riyadhDate } from "@/modules/meetings/slots";

export async function generateMetadata({ params }: PageProps<"/[locale]/admin/bookings/pipeline">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "admin.nav" });
  return { title: t("pipeline"), robots: { index: false } };
}

const FOLLOW_UP_DAYS = 2;

export default async function PipelinePage({ params }: PageProps<"/[locale]/admin/bookings/pipeline">) {
  const locale = await resolveLocale(params);
  await connection();
  const t = await getTranslations({ locale, namespace: "admin" });
  const now = new Date();
  const bookings = (await activeBookings(now)).filter((b) => b.status !== "cancelled");

  const month = riyadhDate(now).slice(0, 7);
  const thisMonth = bookings.filter((b) => riyadhDate(new Date(b.starts_at)).startsWith(month));
  const held = bookings.filter((b) => b.status === "held" || b.status === "customer" || b.status === "not_now").length;
  const customers = bookings.filter((b) => b.status === "customer").length;

  const cards: PipelineCard[] = bookings
    .slice()
    .reverse()
    .map((b) => {
      const upcoming = isUpcoming(b, now);
      const daysSince = (now.getTime() - new Date(b.starts_at).getTime()) / 86_400_000;
      return {
        id: b.id,
        full_name: b.full_name,
        company: b.company,
        locale: b.locale,
        status: b.status,
        notes: b.notes,
        when: formatDate(locale, b.starts_at, { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }),
        // A call that should have happened, or a follow-up that's late.
        overdue: (b.status === "new" && !upcoming) || (b.status === "held" && daysSince > FOLLOW_UP_DAYS),
      };
    });

  const stats = [
    { label: t("pipeline.booked"), value: formatCount(locale, thisMonth.length) },
    { label: t("pipeline.held"), value: formatCount(locale, held) },
  ];

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-8">
      <div className="flex flex-wrap items-end gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow">{t("nav.pipeline")}</span>
          <h1 className="text-[clamp(28px,3.4vw,40px)] leading-none font-extrabold tracking-[-0.04em]">{t("pipeline.title")}</h1>
        </div>
        <dl className="ms-auto flex overflow-hidden rounded-card border border-border bg-white">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col border-e border-border px-5 py-3">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="font-display text-2xl font-extrabold tabular">{s.value}</dd>
            </div>
          ))}
          <div className="flex flex-col bg-ink px-5 py-3 text-sand">
            <dt className="text-xs text-ink-200">{t("pipeline.customers")}</dt>
            <dd className="flex items-baseline gap-2 font-display text-2xl font-extrabold tabular">
              {formatCount(locale, customers)}
              {held > 0 && <span className="text-sm font-semibold text-mint-200">{t("pipeline.rate", { percent: `⁦${formatPercent(locale, customers / held, 0)}⁩` })}</span>}
            </dd>
          </div>
        </dl>
      </div>
      <PipelineBoard cards={cards} />
    </div>
  );
}
