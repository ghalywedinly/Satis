"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Clock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { FormAlert } from "@/components/forms/form-alert";
import type { ErrorKey } from "@/lib/forms";
import { Link } from "@/lib/i18n/navigation";
import type { Locale } from "@/lib/i18n/routing";
import { cn } from "@/lib/utils";
import { setBookingStatus } from "../actions";
import { BOOKING_STATUSES, PIPELINE, type Booking, type BookingStatus } from "../definition";

export type PipelineCard = Pick<Booking, "id" | "full_name" | "company" | "locale" | "status" | "notes"> & { when: string; overdue: boolean };

const COLUMN = {
  new: { bg: "bg-ultra-50", dot: "bg-ultramarine" },
  confirmed: { bg: "bg-sand-100", dot: "bg-ink" },
  held: { bg: "bg-ember-50", dot: "bg-ember" },
  customer: { bg: "bg-mint-50", dot: "bg-mint-600" },
  not_now: { bg: "bg-sand-50", dot: "bg-ink-300" },
} as const;

/**
 * The sales pipeline: drag a card to the next column, or use its "Move to" menu (keyboard and
 * phones). Moves show at once and are saved in the background.
 */
export function PipelineBoard({ cards }: { cards: PipelineCard[] }) {
  const t = useTranslations("admin");
  const te = useTranslations("errors");
  const locale = useLocale() as Locale;
  const [error, setError] = useState<ErrorKey | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<BookingStatus | null>(null);
  const [, startTransition] = useTransition();
  const [shown, move] = useOptimistic(cards, (state, { id, status }: { id: string; status: BookingStatus }) =>
    state.map((card) => (card.id === id ? { ...card, status } : card)),
  );

  const moveTo = (id: string, status: BookingStatus) =>
    startTransition(async () => {
      move({ id, status });
      setError(await setBookingStatus(locale, id, status));
    });

  return (
    <div className="flex flex-col gap-3">
      {error && <FormAlert tone="error">{te(error)}</FormAlert>}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {PIPELINE.map((column) => {
          const items = shown.filter((card) => card.status === column);
          return (
            <section
              key={column}
              aria-label={t(`statuses.${column}`)}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(column);
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                const id = e.dataTransfer.getData("text/plain");
                if (id && shown.find((c) => c.id === id)?.status !== column) moveTo(id, column);
              }}
              className={cn(
                "flex min-h-40 flex-col gap-2.5 rounded-card p-3 transition-shadow duration-[140ms]",
                COLUMN[column].bg,
                over === column && "ring-2 ring-ultramarine",
              )}
            >
              <div className="flex items-center gap-2 px-1 pt-1">
                <span aria-hidden className={cn("slice-sm h-2.5 w-3", COLUMN[column].dot)} />
                <h2 className="text-[15px] font-bold">{t(`statuses.${column}`)}</h2>
                <span className="ms-auto text-sm font-bold text-muted-foreground tabular">{items.length}</span>
              </div>
              <p className="px-1 text-xs text-muted-foreground">{t(`statusHints.${column}`)}</p>
              {items.length === 0 && <p className="rounded-tile border border-dashed border-ink-200 px-3 py-6 text-center text-xs text-muted-foreground">{t("pipeline.empty")}</p>}
              {items.map((card) => (
                <article
                  key={card.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/plain", card.id);
                    setDragging(card.id);
                  }}
                  onDragEnd={() => setDragging(null)}
                  className={cn(
                    "flex cursor-grab flex-col gap-1.5 rounded-tile border border-border bg-white p-3 transition-opacity duration-[140ms] active:cursor-grabbing",
                    dragging === card.id && "opacity-50",
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/bookings/${card.id}`} className="min-w-0 flex-1 truncate rounded-xs text-sm font-bold outline-none hover:underline focus-visible:shadow-focus">
                      {card.company}
                    </Link>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase">{card.locale}</span>
                  </div>
                  <span className="truncate text-[13px] text-muted-foreground">{card.full_name}</span>
                  <span className={cn("flex items-center gap-1.5 text-xs font-semibold", card.overdue ? "text-ember-700" : "text-muted-foreground")}>
                    <Clock aria-hidden strokeWidth={1.75} className="size-3.5" />
                    {card.when}
                  </span>
                  {card.notes && <span className="line-clamp-2 rounded-[8px] bg-sand-50 px-2 py-1.5 text-xs text-ink-600">{card.notes}</span>}
                  <label className="sr-only" htmlFor={`move-${card.id}`}>
                    {t("pipeline.moveTo")}
                  </label>
                  <select
                    id={`move-${card.id}`}
                    value={card.status}
                    onChange={(e) => moveTo(card.id, e.target.value as BookingStatus)}
                    className="mt-1 h-8 rounded-control border border-border bg-white px-2 text-xs font-semibold outline-none focus-visible:shadow-focus"
                  >
                    {BOOKING_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t(`statuses.${status}`)}
                      </option>
                    ))}
                  </select>
                </article>
              ))}
            </section>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">{t("pipeline.dragHint")}</p>
    </div>
  );
}
