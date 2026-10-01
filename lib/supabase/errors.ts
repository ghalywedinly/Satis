import type { ErrorKey } from "@/lib/forms";

/** Error codes raised by our database functions (see supabase/migrations) mapped to messages. */
const DB_ERRORS: Record<string, ErrorKey> = {
  forbidden: "forbidden",
  not_found: "notFoundItem",
  last_owner: "lastOwner",
  cannot_change_self: "cannotChangeSelf",
  already_member: "alreadyMember",
  limit_reached: "limitReached",
  expired: "inviteExpired",
  already_used: "inviteUsed",
  email_mismatch: "emailMismatch",
  not_authenticated: "sessionExpired",
  invalid_survey: "invalidSurvey",
  survey_unavailable: "surveyUnavailable",
};

/** Translates a PostgREST/Postgres error into a user-facing message key. RLS denials read as "forbidden". */
export function dbErrorKey(error: { code?: string; message?: string } | null | undefined): ErrorKey {
  if (!error) return "generic";
  if (error.message && DB_ERRORS[error.message]) return DB_ERRORS[error.message];
  if (error.code === "42501") return "forbidden";
  return "generic";
}
