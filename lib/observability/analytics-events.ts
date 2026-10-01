/** Product events (spec §30). Properties must never contain personal data such as names, emails or answers. */
export type AnalyticsEvent =
  | "signup_started"
  | "signup_completed"
  | "onboarding_started"
  | "onboarding_completed"
  | "organization_created"
  | "location_created"
  | "survey_created"
  | "survey_published"
  | "qr_generated"
  | "qr_downloaded"
  | "survey_started"
  | "survey_completed"
  | "coupon_claimed"
  | "dashboard_viewed"
  | "upgrade_clicked"
  | "subscription_started";
