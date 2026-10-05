import "server-only";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { LocalizedText } from "@/modules/surveys/definition";

/** The business's rewards with how many codes were issued and redeemed. */
export async function listOffers(organizationId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: offers } = await supabase
    .from("coupon_offers")
    .select("id, survey_id, location_id, discount_type, discount_value, note, valid_days, usage_limit, status, created_at, survey:surveys(name), location:locations(name)")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  const rows = offers ?? [];
  const counts = await Promise.all(
    rows.map(async (o) => {
      const [issued, redeemed] = await Promise.all([
        supabase.from("coupon_issuances").select("id", { count: "exact", head: true }).eq("offer_id", o.id),
        supabase.from("coupon_issuances").select("id", { count: "exact", head: true }).eq("offer_id", o.id).not("redeemed_at", "is", null),
      ]);
      return { issued: issued.count ?? 0, redeemed: redeemed.count ?? 0 };
    }),
  );
  // Rows are written only through validated actions, so `note` matches LocalizedText.
  return rows.map((o, i) => ({ ...o, note: o.note as LocalizedText, ...counts[i] }));
}

export type OfferRow = Awaited<ReturnType<typeof listOffers>>[number];
