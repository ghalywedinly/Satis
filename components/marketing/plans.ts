/**
 * Satis plans and prices (Saudi riyals a month, excluding VAT). Text lives in locales/*\/pricing.json;
 * this file holds what the numbers are. Billing isn't live yet: these are the published prices.
 */

export const SEGMENTS = ["visits", "orders", "apps"] as const;
export type Segment = (typeof SEGMENTS)[number];
export const TIERS = ["free", "starter", "growth", "top"] as const;
export type Tier = (typeof TIERS)[number];

/** Growth for visits: a base price for the first locations, then a price per extra location. */
export const VISITS_GROWTH = { base: 299, included: 3, perExtra: 79, min: 3, max: 9, start: 5 } as const;
export const FOUNDERS_PRICE = 149;
export const BUNDLE_DISCOUNT = 0.2;
/** Paying yearly costs ten months. */
export const YEARLY_MONTHS = 10;

export type Plan = {
  tier: Tier;
  /** Monthly price; null when it's agreed per customer. */
  price: number | null;
  /** Shown as "From …" (chains). */
  from?: boolean;
  popular?: boolean;
  /** The visits Growth plan prices by number of locations. */
  perLocation?: boolean;
  cta: "free" | "paid" | "contact";
  features: string[];
};

export const PLANS: Record<Segment, Plan[]> = {
  visits: [
    { tier: "free", price: 0, cta: "free", features: ["publicPage", "seal", "oneQr", "basicDashboard"] },
    { tier: "starter", price: 149, cta: "paid", features: ["unlimitedRatings", "qrEverywhere", "inbox", "fullDashboard", "team3"] },
    { tier: "growth", price: VISITS_GROWTH.base, popular: true, perLocation: true, cta: "paid", features: ["whatsapp", "rewards", "ai", "unlimitedTeam", "hideBrand"] },
    { tier: "top", price: 1500, from: true, cta: "contact", features: ["pos", "receiptQr", "roles", "manager"] },
  ],
  orders: [
    { tier: "free", price: 0, cta: "free", features: ["publicPage", "badge", "afterDelivery", "basicDashboard"] },
    { tier: "starter", price: 99, cta: "paid", features: ["productReviews", "badgeProducts", "inboxReply", "team3"] },
    { tier: "growth", price: 349, popular: true, cta: "paid", features: ["photos", "carriers", "returns", "whatsappOrders", "ai"] },
    { tier: "top", price: null, cta: "contact", features: ["storeConnect", "multiStore", "manager"] },
  ],
  apps: [
    { tier: "free", price: 0, cta: "free", features: ["widget", "nps", "basicDashboard"] },
    { tier: "starter", price: 299, cta: "paid", features: ["featureFeedback", "support", "bilingual", "team5"] },
    { tier: "growth", price: 899, popular: true, cta: "paid", features: ["atRisk", "tools", "targeting", "ai"] },
    { tier: "top", price: null, cta: "contact", features: ["sso", "dpa", "dedicated"] },
  ],
};

/**
 * Comparison rows: true/false for a tick or dash, a number for a count, or a row key from
 * pricing.rows / pricing.compare for text.
 */
export type Cell = boolean | number | "unlimited" | "from3" | "tenPlus";
export const COMPARE: Record<Segment, { row: string; cells: [Cell, Cell, Cell, Cell] }[]> = {
  visits: [
    { row: "rows.branches", cells: [1, 1, "from3", "tenPlus"] },
    { row: "rows.ratings", cells: [50, "unlimited", "unlimited", "unlimited"] },
    { row: "features.publicPage", cells: [true, true, true, true] },
    { row: "features.qrEverywhere", cells: [false, true, true, true] },
    { row: "features.whatsapp", cells: [false, false, true, true] },
    { row: "features.rewards", cells: [false, false, true, true] },
    { row: "features.ai", cells: [false, false, true, true] },
    { row: "features.pos", cells: [false, false, false, true] },
    { row: "rows.team", cells: [1, 3, "unlimited", "unlimited"] },
  ],
  orders: [
    { row: "rows.orders", cells: [50, 300, 2000, "unlimited"] },
    { row: "features.badge", cells: [true, true, true, true] },
    { row: "features.productReviews", cells: [false, true, true, true] },
    { row: "features.photos", cells: [false, false, true, true] },
    { row: "features.carriers", cells: [false, false, true, true] },
    { row: "features.returns", cells: [false, false, true, true] },
    { row: "features.storeConnect", cells: [false, false, false, true] },
    { row: "rows.team", cells: [1, 3, "unlimited", "unlimited"] },
  ],
  apps: [
    { row: "rows.users", cells: [100, 1000, 10000, "unlimited"] },
    { row: "features.widget", cells: [true, true, true, true] },
    { row: "features.featureFeedback", cells: [false, true, true, true] },
    { row: "features.support", cells: [false, true, true, true] },
    { row: "features.atRisk", cells: [false, false, true, true] },
    { row: "features.tools", cells: [false, false, true, true] },
    { row: "features.sso", cells: [false, false, false, true] },
    { row: "rows.team", cells: [1, 5, "unlimited", "unlimited"] },
  ],
};

export const visitsGrowthPrice = (locations: number) => VISITS_GROWTH.base + VISITS_GROWTH.perExtra * Math.max(0, locations - VISITS_GROWTH.included);
