import type { Metadata } from "next";
import { Ticket } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/card";
import { formatCount, formatNumber } from "@/lib/i18n/format";
import { resolveLocale } from "@/lib/i18n/server";
import { requireMembership } from "@/lib/org/context";
import { can } from "@/lib/permissions";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { OfferActions } from "@/modules/coupons/components/offer-actions";
import { OfferDialog } from "@/modules/coupons/components/offer-dialog";
import { RedeemPanel } from "@/modules/coupons/components/redeem-panel";
import { discountAmount } from "@/modules/coupons/definition";
import { listOffers, type OfferRow } from "@/modules/coupons/queries";
import { textIn } from "@/modules/surveys/definition";

export async function generateMetadata({ params }: PageProps<"/[locale]/coupons">): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const t = await getTranslations({ locale, namespace: "coupons" });
  return { title: t("metaTitle") };
}

export default async function CouponsPage({ params }: PageProps<"/[locale]/coupons">) {
  const locale = await resolveLocale(params);
  const { membership } = await requireMembership(locale);
  const organizationId = membership.organization.id;
  const canManage = can(membership.role, "coupons.manage");
  const canRedeem = can(membership.role, "coupons.redeem");
  const supabase = await createSupabaseServerClient();
  const [t, offers, surveys, locations] = await Promise.all([
    getTranslations({ locale, namespace: "coupons" }),
    listOffers(organizationId),
    supabase.from("surveys").select("id, name").eq("organization_id", organizationId).neq("status", "archived").order("name"),
    supabase.from("locations").select("id, name").eq("organization_id", organizationId).is("archived_at", null).order("name"),
  ]);
  const surveyOptions = surveys.data ?? [];
  const locationOptions = locations.data ?? [];
  const current = offers.filter((o) => o.status !== "archived");
  const ended = offers.filter((o) => o.status === "archived");

  const offerCard = (offer: OfferRow) => {
    const note = textIn(offer.note, locale, locale === "ar" ? "en" : "ar");
    return (
      <li key={offer.id} className={cn("flex flex-col gap-4 rounded-card border border-border bg-white p-5", offer.status === "archived" && "opacity-70")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <p className="font-display text-2xl font-extrabold">{t("off", { amount: discountAmount(locale, offer.discount_type, offer.discount_value) })}</p>
            {note && <p className="text-sm text-muted-foreground">{note}</p>}
          </div>
          <StatusPill status={offer.status} label={t(`offers.status.${offer.status}`)} />
        </div>
        <p className="text-sm text-muted-foreground">
          {offer.survey?.name}
          {" · "}
          {offer.location?.name ?? t("offers.allLocations")}
          {" · "}
          {t("offers.validDays", { days: formatNumber(locale, offer.valid_days) })}
        </p>
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-sand-100 px-3 py-1 font-semibold">
            {offer.usage_limit
              ? t("offers.issuedOfLimit", { count: formatCount(locale, offer.issued), limit: formatCount(locale, offer.usage_limit) })
              : t("offers.issued", { count: formatCount(locale, offer.issued) })}
          </span>
          <span className="rounded-full bg-mint-50 px-3 py-1 font-semibold text-mint-700">{t("offers.redeemedCount", { count: formatCount(locale, offer.redeemed) })}</span>
        </div>
        {canManage && offer.status !== "archived" && (
          <div className="flex flex-wrap items-center gap-1 border-t border-border pt-3">
            <OfferDialog
              surveys={surveyOptions}
              locations={locationOptions}
              offer={{
                id: offer.id,
                surveyId: offer.survey_id,
                locationId: offer.location_id,
                discountType: offer.discount_type,
                discountValue: offer.discount_value,
                validDays: offer.valid_days,
                usageLimit: offer.usage_limit,
                noteAr: offer.note.ar ?? "",
                noteEn: offer.note.en ?? "",
              }}
            />
            <OfferActions offerId={offer.id} status={offer.status} />
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex max-w-2xl flex-col gap-1.5">
          <h1 className="text-3xl font-extrabold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("subtitle")}</p>
        </div>
        {canManage && <OfferDialog surveys={surveyOptions} locations={locationOptions} />}
      </div>
      {!canManage && <p className="text-sm text-muted-foreground">{t("readOnly")}</p>}

      {canRedeem && (
        <Card className="gap-4 px-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-bold">{t("redeem.title")}</h2>
            <p className="text-sm text-muted-foreground">{t("redeem.body")}</p>
          </div>
          <RedeemPanel locations={locationOptions} />
        </Card>
      )}

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold">{t("offers.title")}</h2>
        {current.length === 0 ? (
          <div className="flex items-start gap-4 rounded-card border border-dashed border-ink-200 bg-white p-6">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-[14px] bg-ember-50 text-ember-600">
              <Ticket aria-hidden strokeWidth={1.75} className="size-6" />
            </span>
            <p className="text-muted-foreground">{t("offers.empty")}</p>
          </div>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">{current.map(offerCard)}</ul>
        )}
      </section>

      {ended.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold text-muted-foreground">{t("offers.ended")}</h2>
          <ul className="grid gap-4 md:grid-cols-2">{ended.map(offerCard)}</ul>
        </section>
      )}
    </div>
  );
}

function StatusPill({ status, label }: { status: OfferRow["status"]; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        status === "active" ? "bg-mint-50 text-mint-700" : status === "paused" ? "bg-ember-50 text-ember-700" : "bg-sand-100 text-ink-600",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", status === "active" ? "bg-mint-500" : status === "paused" ? "bg-ember-500" : "bg-ink-400")} />
      {label}
    </span>
  );
}
