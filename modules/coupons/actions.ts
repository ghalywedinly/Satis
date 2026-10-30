"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/session";
import { fieldErrorsFrom, text, type ErrorKey, type FormState } from "@/lib/forms";
import type { Locale } from "@/lib/i18n/routing";
import { captureServerEvent } from "@/lib/observability/analytics";
import { getActiveMembership } from "@/lib/org/context";
import { can, type Permission } from "@/lib/permissions";
import { dbErrorKey } from "@/lib/supabase/errors";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { CouponOfferStatus } from "@/types/database";
import type { Coupon } from "./definition";
import { couponCodeSchema, offerSchema } from "./schemas";

export type OfferField = "surveyId" | "locationId" | "discountType" | "discountValue" | "validDays" | "usageLimit" | "noteAr" | "noteEn";

const id = z.uuid();

async function authorize(locale: Locale, permission: Permission) {
  const user = await requireUser(locale);
  const membership = await getActiveMembership();
  if (!membership || !can(membership.role, permission)) return null;
  return { user, organizationId: membership.organization.id };
}

/** Creates a reward, or updates one when the form includes `offerId`. */
export async function saveOffer(locale: Locale, _prev: FormState<OfferField>, formData: FormData): Promise<FormState<OfferField>> {
  const auth = await authorize(locale, "coupons.manage");
  if (!auth) return { status: "error", formError: "forbidden" };

  const fields: OfferField[] = ["surveyId", "locationId", "discountType", "discountValue", "validDays", "usageLimit", "noteAr", "noteEn"];
  const raw = Object.fromEntries(fields.map((f) => [f, text(formData, f)])) as Record<OfferField, string>;
  const parsed = offerSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrorsFrom(parsed.error), values: raw };
  const o = parsed.data;
  const note = Object.fromEntries(Object.entries({ ar: o.noteAr, en: o.noteEn }).filter(([, v]) => v));
  const values = {
    location_id: o.locationId,
    discount_type: o.discountType,
    discount_value: o.discountValue,
    note,
    valid_days: o.validDays,
    usage_limit: o.usageLimit,
  };

  const supabase = await createSupabaseServerClient();
  const offerId = text(formData, "offerId");
  const { data, error } = offerId
    ? id.safeParse(offerId).success
      ? await supabase.from("coupon_offers").update(values).eq("id", offerId).eq("organization_id", auth.organizationId).select("id")
      : { data: null, error: null }
    : await supabase
        .from("coupon_offers")
        .insert({ ...values, organization_id: auth.organizationId, survey_id: o.surveyId })
        .select("id");
  if (error?.code === "23505") return { status: "error", formError: "offerActiveExists", values: raw };
  if (error || !data?.length) return { status: "error", formError: error ? dbErrorKey(error) : "notFoundItem", values: raw };

  captureServerEvent("coupon_offer_saved", auth.user.id, { organization_id: auth.organizationId, discount_type: o.discountType, created: !offerId });
  refresh();
  return { status: "success" };
}

export async function setOfferStatus(locale: Locale, offerId: string, status: CouponOfferStatus): Promise<ErrorKey | null> {
  const auth = await authorize(locale, "coupons.manage");
  if (!auth) return "forbidden";
  if (!id.safeParse(offerId).success) return "notFoundItem";
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("coupon_offers")
    .update({ status })
    .eq("id", offerId)
    .eq("organization_id", auth.organizationId)
    .select("id");
  if (error?.code === "23505") return "offerActiveExists";
  if (error || !data?.length) return error ? dbErrorKey(error) : "notFoundItem";
  refresh();
  return null;
}

export type CouponCheck =
  | { status: "not_found" }
  | (Coupon & { status: "valid" | "redeemed" | "expired"; issuedAt: string; redeemedAt: string | null });

export type CouponResult = { error: ErrorKey } | { coupon: CouponCheck };

/** Staff: what a code is worth and whether it can still be used. */
export async function checkCoupon(locale: Locale, code: string): Promise<CouponResult> {
  const auth = await authorize(locale, "coupons.redeem");
  if (!auth) return { error: "forbidden" };
  const parsed = couponCodeSchema.safeParse(code);
  if (!parsed.success) return { coupon: { status: "not_found" } };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("lookup_coupon", { p_organization_id: auth.organizationId, p_code: parsed.data });
  if (error) return { error: dbErrorKey(error) };
  return { coupon: data as unknown as CouponCheck };
}

/** Staff: marks a code used, once. */
export async function redeemCoupon(locale: Locale, code: string, locationId: string | null): Promise<CouponResult> {
  const auth = await authorize(locale, "coupons.redeem");
  if (!auth) return { error: "forbidden" };
  const parsed = couponCodeSchema.safeParse(code);
  if (!parsed.success) return { error: "notFoundItem" };
  if (locationId && !id.safeParse(locationId).success) return { error: "notFoundItem" };
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.rpc("redeem_coupon", {
    p_organization_id: auth.organizationId,
    p_code: parsed.data,
    p_location_id: locationId,
  });
  if (error) return { error: dbErrorKey(error) };
  captureServerEvent("coupon_redeemed", auth.user.id, { organization_id: auth.organizationId });
  refresh();
  return { coupon: data as unknown as CouponCheck };
}
