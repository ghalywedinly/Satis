# Satis — architecture proposal

Status: **approved** (all recommendations in §2 accepted). Phases 1–5 implemented (foundation; businesses, locations, team; surveys, QR codes, public survey; feedback inbox; analytics dashboard).

This answers "First task" of the master build specification: the current state of the repository, the proposed architecture, database schema, folder structure, environment variables, external services, security requirements and risks. Each section separates **MVP** from **Future**.

---

## 1. Current state of the repository

The repository is not empty. It has a small, working base:

| What | State |
|---|---|
| Next.js 16.3 (App Router), React 19.2, TypeScript, Tailwind CSS v4 | Set up, builds, lints clean |
| shadcn/ui | Configured by hand (`components.json`, `lib/utils.ts`). Its registry (`ui.shadcn.com`) is blocked from this cloud environment, so components cannot be pulled with the CLI here |
| Brand system | `app/globals.css` (tokens), `app/fonts.ts`, `components/brand/` (logo, slice elements), `public/brand/` (SVGs), brand rules in `CLAUDE.md`, full handoff in `Satis Branding/` |
| Starter page `/` | Replaced by the landing page (hero, how it works, features, customer flow, dashboard showcase, pricing, FAQ) |
| Survey prototype | `/en/survey`, `/ar/survey`, on branch `claude/festive-mayer-itj3hl` only (not on `main`). Static, not connected to data, and its text lives in a TypeScript file instead of an i18n system |
| Supabase, auth, database, i18n, tests, CI | None yet |

**What has to change in existing code**

- The survey prototype is visually right but structurally wrong for the spec: its strings are hardcoded in `components/survey/copy.ts`, and its URL (`/[lang]/survey`) is not the public `/s/{code}` link. In Phase 3 it becomes the public survey: its visuals and components are reused, and its text moves to `locales/`.
- The root layout hardcodes `<html lang="en">`. It moves under a locale-aware layout so Arabic pages render `lang="ar" dir="rtl"` at the document level.
- The current CSS in `globals.css` and the brand components already avoid physical `left/right` in most places; the few remaining (`ltr:right-0 rtl:left-0` in the prototype) become logical (`end-0`).

---

## 2. Decisions that need your input

These are places where the specification and the brand handoff disagree, or where a choice changes cost or scope. My recommendation is first.

1. **Arabic font.** The spec suggests IBM Plex Sans Arabic or Noto Sans Arabic. The brand handoff specifies **Readex Pro**, a font designed for Arabic (not a Latin font). **Recommendation: keep Readex Pro**, it satisfies the spec's rule and matches the brand.
2. **Hero headline.** Spec: "اسمع عملاءك. افهم أعمالك. حسّن كل تجربة." Brand handoff: "Satisfaction, measured. / رضا عملائك، بالأرقام." **Recommendation:** spec line as the landing-page hero; brand tagline as the secondary line and in the footer/meta.
3. **What counts as the launch MVP.** **Recommendation:** Phases 1–6, plus Phase 8 (billing, so you can charge 150 SAR) and Phase 9 (production hardening). Phase 7 (AI) ships in a reduced form at launch: per-response sentiment and themes, and a weekly summary. Full insights come after launch.
4. **Role scope.** **Recommendation:** in the MVP a member's role applies to the whole organization. Restricting a manager or staff member to specific locations is designed for (table reserved below) but built later.
5. **Survey shape for customers.** The spec says "question → question → comment → thank you". **Recommendation:** short surveys (2–5 questions) render on one screen like the brand mockup; longer surveys step through one question per screen. Both use the same components.
6. **Public survey domain.** `satis.sa` requires registering a `.sa` domain, which needs a Saudi entity. Until then, a `.com` or Vercel domain works. Links are generated from one setting, so switching later only matters for QR codes already printed (see risk R7).

---

## 3. Architecture

### 3.1 Shape: modular monolith

One Next.js application deployed to Vercel, one Supabase project per environment. Code is organized by **domain module**, so a domain can be extracted into a service later without untangling it from the rest:

```
organizations · locations · members · surveys · responses · analytics · coupons · ai · billing · notifications
```

Each module owns its database access, validation schemas, server actions and UI. Modules talk to each other through their exported functions, never by reaching into each other's tables from UI code.

### 3.2 Request flows

**Business dashboard (authenticated)**

```
Browser ─▶ proxy.ts (refresh Supabase session cookie, locale, route protection)
        ─▶ Server Component / Server Action
             ├─ authorize: lib/permissions (role check, server-side)
             └─ Supabase client acting AS THE USER (their JWT)
                  └─ Postgres Row Level Security enforces tenant isolation again
```

Authorization is checked twice: in server code (for clear errors and UX) and by RLS in the database (so a bug in server code can't leak another tenant's data). The browser never decides what a user may do.

**Public survey (anonymous customer)**

```
QR ─▶ GET /s/{code}  ─▶ cached published survey snapshot (one row, invalidated on publish)
     POST /api/public/responses
         ├─ validate payload (Zod)
         ├─ rate limit (hashed IP + survey) and honeypot/timing checks
         └─ submit_response() Postgres function, one transaction:
              validates answers against the published version,
              writes response + answers, computes CSAT/NPS fields, issues coupon
```

Anonymous visitors get **no** direct table access. The only write path is one server endpoint calling one database function.

**Background work (no queue infrastructure)**

A `jobs` table in Postgres plus Vercel Cron calling protected `/api/cron/*` routes. Workers claim jobs with `FOR UPDATE SKIP LOCKED`. This covers AI batches, weekly summary emails, data-retention cleanup and rate-limit cleanup. No Redis, no Kafka. If volume ever requires it, the table can be swapped for a managed queue behind the same interface.

### 3.3 Key technical choices

| Area | Choice | Why |
|---|---|---|
| Data access | `@supabase/supabase-js` + generated TypeScript types, SQL migrations | Keeps RLS in force on every query. An ORM connecting as a privileged role would silently bypass RLS |
| Auth | Supabase Auth via `@supabase/ssr` (httpOnly cookies) | Required by spec; email/password + verification + reset in MVP; Google/Microsoft/SSO are configuration later |
| i18n | `next-intl` (supports Next 16), messages in `locales/{ar,en}/*.json` | Mature, server-component friendly, typed message keys. CI fails if Arabic and English key sets differ |
| Locale routing | Arabic at `/…`, English at `/en/…` (prefix only for non-default) | Arabic default, shareable and SEO-friendly URLs. Signed-in users are sent to their saved language |
| Survey language | Separate from dashboard: each survey has a default language and an allowed list; customers can switch | As required by spec §3 |
| Validation | Zod schemas shared by forms and server | One definition, validated again on the server |
| Forms | shadcn/ui form components + react-hook-form | Standard with shadcn |
| Charts | Recharts via shadcn chart components, styled with brand tokens | Dashboard only, never shipped to the public survey |
| QR | `qrcode` library, generated server-side as SVG and PNG | No client JS, crisp print output |
| Email | `EmailProvider` interface, Resend implementation, React Email templates per locale | Replaceable provider |
| AI | `AIProvider` interface (`generateStructured(schema, input)`), Anthropic and OpenAI implementations | Replaceable provider; structured output validated with Zod |
| Payments | `PaymentProvider` interface; provider chosen in Phase 8 (Saudi options: Moyasar, Tap, HyperPay, PayTabs — all support mada) | Stripe does not onboard Saudi entities |
| Errors | Sentry (`@sentry/nextjs`) with PII scrubbing | Required by spec |
| Product analytics | PostHog. Public survey events captured **server-side** | Keeps the customer page free of analytics JavaScript |
| Testing | Vitest (unit/integration), pgTAP (RLS tests), Playwright (E2E) | See §8 |

### 3.4 Localization and RTL rules

- No UI string in components. Every string is `t("…")` from `locales/`. Enforced in review and by a lint rule for JSX literals.
- Layout uses logical properties only (`ms-`, `me-`, `ps-`, `pe-`, `start-`, `end-`, `text-start`). A lint check flags `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`, `text-left`, `text-right` in app code.
- Directional icons (arrows, chevrons) flip with `rtl:-scale-x-100`, applied in one shared `DirectionalIcon` wrapper.
- **Numbers:** Western digits (0–9) in both languages by default (`ar-SA-u-nu-latn`), which is common in Saudi software. Arabic-Indic digits can be a per-organization setting later.
- **Currency:** "ر.س" in Arabic, "SAR" in English, formatted in one helper. (The new Saudi Riyal symbol, U+20C1, is a later option once font support is broad.)
- **Dates and weeks:** Gregorian calendar by default; week starts on Sunday for Saudi organizations. Hijri display is Future.
- **Time zone:** every organization has a time zone (default `Asia/Riyadh`); all daily/weekly analytics buckets use it.

### 3.5 Performance on the public survey

- Rendered on the server from a cached snapshot; one small client component for interactions (rating, answer selection, submit).
- No charting, analytics or form libraries on that route; its own root layout so the dashboard's providers aren't loaded.
- Only the fonts needed for the survey's language are preloaded.
- Budget measured in CI with Lighthouse on a mobile profile; target LCP under 1.5s on 4G. Measure first, then optimize.

---

## 4. Database schema

Conventions: every table has `id uuid primary key default gen_random_uuid()`, `created_at` and `updated_at timestamptz` (trigger-maintained). **Every tenant-owned table carries `organization_id`**, even when derivable through a parent, so RLS policies are a single indexed check rather than joins. Soft delete (`archived_at`) where history must be kept.

### 4.1 MVP tables

**Identity and tenancy (Phases 1–2)**

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id` (= `auth.users.id`), `full_name`, `locale` (`ar`/`en`), `last_organization_id` | Supabase owns `auth.users`; we never duplicate the email/password there |
| `organizations` | `name`, `slug`, `business_type` (enum), `default_locale`, `timezone`, `logo_path`, `brand_color`, `created_by` | The tenant |
| `organization_members` | `organization_id`, `user_id`, `role` (enum: owner, admin, manager, staff, viewer) | Unique (`organization_id`, `user_id`). At least one owner enforced by trigger |
| `organization_invitations` | `organization_id`, `email`, `role`, `token_hash`, `expires_at`, `accepted_at`, `invited_by` | Token stored hashed |
| `locations` | `organization_id`, `name`, `city`, `address`, `archived_at` | "Jeddah – Tahlia" |
| `audit_logs` | `organization_id`, `actor_id`, `action`, `entity_type`, `entity_id`, `metadata jsonb` | Append-only. MVP records membership/role changes, deletions, publishing, billing changes |

**Surveys (Phase 3)**

| Table | Key columns | Notes |
|---|---|---|
| `surveys` | `organization_id`, `name`, `description`, `status` (draft/published/paused/archived), `default_locale`, `locales text[]`, `thank_you jsonb` (per locale), `branding jsonb`, `current_version_id` | The editable draft |
| `survey_questions` | `organization_id`, `survey_id`, `type` (enum), `position`, `required`, `title jsonb`, `description jsonb`, `settings jsonb`, `role` (`csat`/`nps`/null), `archived_at` | Text stored per locale: `{"ar": "...", "en": "..."}` |
| `survey_question_options` | `organization_id`, `question_id`, `position`, `label jsonb` | For choice/dropdown questions |
| `survey_versions` | `organization_id`, `survey_id`, `version`, `definition jsonb`, `published_at`, `published_by` | **Immutable snapshot** created on publish. Public page reads only this |
| `survey_links` | `organization_id`, `survey_id`, `location_id`, `public_code` (unique, 8-char random base62), `is_active` | One per survey × location; the QR target `/s/{public_code}`. No internal IDs in URLs |

Why versions: if a business edits a question after 2,000 responses, the old responses must still mean what they meant. Editing changes the draft; publishing creates a new version; every response records the version it answered.

MVP question types: rating (1–5), NPS (0–10), single choice, multiple choice, text. Star, emoji, yes/no and dropdown are variations of these and are added later without schema changes (`type` enum + `settings`).

**Responses and inbox (Phase 4)**

| Table | Key columns | Notes |
|---|---|---|
| `survey_responses` | `organization_id`, `survey_id`, `survey_version_id`, `location_id`, `link_id`, `submission_id` (unique, client-generated), `locale`, `submitted_at`, `csat_score`, `nps_score`, `has_comment`, `device_type`, `status` (new/in_progress/resolved), `is_read`, `is_important`, `comment_text`, `rating_sentiment` (generated) | Scores and written comments are copied onto the response at submission so the inbox and dashboards read one table. `submission_id` makes retries idempotent. Search is `ilike` on `comment_text` within one business; a trigram index is added when measured query times need it |
| `survey_answers` | `organization_id`, `response_id`, `question_id`, `value_number`, `value_text`, `value_option_ids uuid[]` | Validated against the version by `submit_response()` |
| `feedback_tags` | `organization_id`, `name` (unique per business, case-insensitive) | `color` and `source` (manual/ai) arrive with AI themes in Phase 7 |
| `response_tags` | `response_id`, `tag_id`, `organization_id` | Composite foreign keys keep both sides in the same business |
| `response_contacts` (later) | `organization_id`, `response_id`, `name`, `phone`, `email`, `consent_at` | Not built yet: the survey doesn't ask for contact details. **Optional PII, kept separate** from answers; stricter RLS (admin+); deletable without losing the anonymous response |

Not stored: IP addresses (only a salted hash inside the rate-limit table, expiring), full user agents (only `device_type`).

**Coupons (Phase 6)**

| Table | Key columns | Notes |
|---|---|---|
| `coupon_offers` | `organization_id`, `survey_id`, `location_id` (nullable = all), `title jsonb`, `discount_type`, `discount_value`, `valid_days`, `usage_limit`, `status` | The reward rule |
| `coupon_issuances` | `organization_id`, `offer_id`, `response_id`, `code` (unique), `expires_at`, `redeemed_at`, `redeemed_by`, `redeemed_location_id` | One unique code per completed response, so codes can't be shared. Redemption is a staff screen for MVP; POS integrations later use the same table |

**Billing (Phase 8)**

| Table | Key columns | Notes |
|---|---|---|
| `plans` | `key` (free/starter/growth/enterprise), `name jsonb`, `prices jsonb` (per interval, in halalas, currency SAR), `limits jsonb` (responses/month, locations, seats), `is_public` | Pricing is data, not code |
| `subscriptions` | `organization_id`, `plan_id`, `status`, `interval`, `current_period_end`, `cancel_at_period_end`, `provider`, `provider_subscription_id` | Written **only** by webhook handler/server |
| `invoices` | `organization_id`, `subscription_id`, `amount`, `vat_amount`, `currency`, `status`, `provider_invoice_id`, `pdf_path` | VAT 15% |
| `billing_events` | `provider`, `provider_event_id` (unique), `type`, `payload jsonb`, `processed_at` | Webhook log; uniqueness makes processing idempotent |

**AI (Phase 7, reduced at launch)**

| Table | Key columns | Notes |
|---|---|---|
| `response_analyses` | `organization_id`, `response_id`, `sentiment`, `themes text[]`, `language`, `model`, `prompt_version` | Produced in batches |
| `ai_insights` | `organization_id`, `location_id`, `period_start`, `period_end`, `kind`, `observed jsonb`, `interpretation jsonb` (per locale), `model`, `prompt_version` | **`observed`** = numbers computed in SQL (e.g. "slow service: 18 mentions, Tahlia, 18:00–22:00"). **`interpretation`** = AI text, shown labelled as AI-generated |
| `ai_insight_evidence` | `insight_id`, `response_id` | Every insight links to the responses behind it; insights without evidence are rejected |

**Infrastructure**

| Table | Purpose |
|---|---|
| `jobs` | Background work queue (type, payload, run_at, attempts, locked_at, error) |
| `rate_limits` | Fixed-window counters keyed by hashed key; rows expire |

### 4.2 Future tables (not built in MVP)

`customers` (known repeat customers / loyalty), `organization_member_locations` (location-scoped roles), `notifications` (in-app), `integrations`, `api_keys` (hashed), `outbound webhook_events`, `feedback_categories` (hierarchy over tags), `response_replies` (replying to customers), `data_requests` (privacy export/deletion workflow), `daily_response_stats` (rollup table, added only when measured query times need it).

### 4.3 Indexes (from expected queries)

- `organization_members (user_id)` — "which orgs can this user see" (used by every RLS check).
- `survey_responses (organization_id, submitted_at desc)` — dashboard and inbox default view.
- `survey_responses (location_id, submitted_at desc)`, `(survey_id, submitted_at desc)` — filters.
- `survey_responses (organization_id, status, is_read)` partial on unresolved — inbox counts.
- `survey_responses using gin (search)` — inbox search (Arabic and English text, `simple` config plus trigram for Arabic).
- `survey_answers (response_id)`, `(question_id)` — question-level analytics.
- `survey_links (public_code)` unique — public lookups.
- `coupon_issuances (code)` unique.

At hundreds of thousands of responses these indexes keep dashboard queries in the low milliseconds. If an organization reaches millions, the rollup table is added; no rewrite needed.

### 4.4 Row Level Security model

- RLS enabled on **every** table in the `public` schema, default deny.
- Helper functions (`security definer`, `stable`): `is_member(org_id)`, `has_role(org_id, min_role)` with role order owner > admin > manager > staff > viewer.
- Typical policies: members can `select`; managers+ can write surveys, locations, coupons; staff+ can triage the inbox and redeem coupons; admins+ manage members and see `response_contacts`; only owners manage billing and delete the organization.
- `subscriptions`, `invoices`, `billing_events`, `jobs`, `rate_limits`: no client access at all; server only.
- Anonymous role: **no table privileges**; public reads come from the cached published snapshot through server code.
- Every policy is covered by pgTAP tests: "user from org A cannot read/write org B" for every table.

---

## 5. Folder structure

```
app/
  [locale]/                     # root layout: <html lang dir>, fonts, i18n provider
    (marketing)/                # landing, pricing, legal
    (auth)/                     # login, signup, verify, forgot/reset password, accept-invite
    (app)/                      # authenticated shell (sidebar, org switcher)
      onboarding/
      dashboard/
      inbox/
      surveys/  [surveyId]/edit|preview|share
      locations/
      coupons/
      settings/ organization|members|billing|notifications
  s/[code]/                     # PUBLIC survey: own root layout, minimal JS
  auth/callback/                # Supabase code exchange (email links)
  api/
    public/responses/           # survey submission
    cron/[job]/                 # Vercel Cron entry points (CRON_SECRET)
    webhooks/payments/          # signature-verified
    hooks/auth-email/           # Supabase "send email" hook (localized auth emails)
proxy.ts                        # Next 16 proxy: session refresh, locale, protection
modules/                        # domain modules (server actions, queries, schemas, domain UI)
  organizations/ locations/ members/ surveys/ responses/
  analytics/ coupons/ ai/ billing/ notifications/
components/
  ui/                           # shadcn primitives (brand-styled)
  brand/                        # logo, slices (exists)
  app-shell/  forms/  charts/
lib/
  supabase/                     # server.ts, browser.ts, admin.ts (server-only)
  i18n/                         # routing, request config, formatters (numbers, SAR, dates)
  permissions/  validation/  rate-limit/  jobs/
  ai/        # AIProvider + anthropic.ts, openai.ts
  email/     # EmailProvider + resend.ts, templates/
  billing/   # PaymentProvider + entitlements
  observability/  # Sentry, PostHog server capture
  env.ts     # validated env vars; secrets only importable server-side
locales/
  ar/  en/   # common.json, marketing.json, auth.json, app.json, survey.json, emails.json, errors.json
supabase/
  config.toml
  migrations/                   # timestamped SQL, the only way the schema changes
  tests/                        # pgTAP RLS tests
  seed.sql                      # DEVELOPMENT ONLY sample data, clearly marked
tests/
  unit/  integration/  e2e/
types/   # generated database types
docs/    # this proposal, runbooks (migrations, deploys)
```

Note: I'm proposing `modules/` in addition to the spec's `lib/` layout so each domain is self-contained — that's what makes the monolith splittable later. Shared infrastructure stays in `lib/`.

---

## 6. Environment variables

Documented in `.env.example`; real values only in `.env.local` (git-ignored) and in Vercel/GitHub settings. `lib/env.ts` validates them at startup and makes server-only secrets impossible to import from client code.

| Variable | Scope | Phase |
|---|---|---|
| `APP_ENV` (`development`/`staging`/`production`) | server | 1 |
| `NEXT_PUBLIC_SITE_URL` | public | 1 |
| `NEXT_PUBLIC_SURVEY_BASE_URL` (domain used in QR codes) | public | 3 |
| `NEXT_PUBLIC_SUPABASE_URL` | public | 1 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | public (safe; RLS applies) | 1 |
| `SUPABASE_SECRET_KEY` | **server secret** | 1 |
| `SUPABASE_DB_PASSWORD` / project ref (CLI, CI migrations) | CI secret | 1 |
| `RATE_LIMIT_SALT` | server secret | 3 |
| `CRON_SECRET` | server secret | 4 |
| `RESEND_API_KEY`, `EMAIL_FROM` | server secret | 1 (auth emails) |
| `AUTH_EMAIL_HOOK_SECRET` | server secret | 1 |
| `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` | DSN public; token CI secret | 1 (wired), 9 (tuned) |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | public | 1 (wired), 9 |
| `AI_PROVIDER`, `AI_MODEL`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY` | server secret | 7 |
| `PAYMENT_PROVIDER`, `PAYMENT_SECRET_KEY`, `PAYMENT_WEBHOOK_SECRET`, `NEXT_PUBLIC_PAYMENT_PUBLISHABLE_KEY` | secret / public | 8 |

---

## 7. External services

| Service | What you need to set up | When |
|---|---|---|
| **Supabase** | Three projects: `satis-dev`, `satis-staging`, `satis-prod`, in the nearest available region to Saudi Arabia. Custom SMTP pointed at Resend | Phase 1 |
| **Vercel** | Project linked to GitHub. **Pro plan** before launch (Hobby is non-commercial and limits cron frequency). Preview deployments → staging Supabase; production → prod Supabase | Phase 1 (Hobby OK for dev) |
| **GitHub** | Branch protection on `main` (PR + passing CI required); Actions secrets for migrations | Phase 1 |
| **Resend** | Account + verified sending domain (DNS records) | Phase 1 |
| **Sentry** | Project (Next.js) | Phase 1 wiring |
| **PostHog** | Project (EU or US cloud) | Phase 1 wiring |
| **AI provider** | Anthropic and/or OpenAI API key, with a data-processing agreement | Phase 7 |
| **Payment provider** | Saudi provider account (requires commercial registration) | Phase 8 |
| **Domain** | `satis.sa` (needs Saudi entity) or interim `.com` | Before printing real QR codes |

**This cloud development environment** currently blocks `*.supabase.co`, `api.supabase.com`, `sentry.io`, PostHog and `ui.shadcn.com`. To let me run against your dev Supabase project and pull shadcn components, add those hosts to the environment's allowed domains (environment settings → Network access). Until then I can still write and test all migrations and RLS policies against the local PostgreSQL 16 in this container.

---

## 8. Security requirements (and how each is met)

| Requirement | Implementation |
|---|---|
| Authentication | Supabase Auth, httpOnly secure cookies via `@supabase/ssr`, session refreshed in `proxy.ts`, email verification required before creating an organization |
| Authorization | Server-side role checks in every action **and** RLS in the database |
| Tenant isolation | `organization_id` on every tenant table, RLS default-deny, pgTAP tests per table |
| Input validation | Zod on every server action and route handler; DB constraints as the last line |
| SQL injection | Parameterized queries only (supabase-js / SQL functions); no string-built SQL |
| XSS | React escaping; no `dangerouslySetInnerHTML` for user content; strict CSP |
| CSRF | Server Actions' built-in origin check; route handlers that mutate verify `Origin`; cookies `SameSite=Lax` |
| Secure headers | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `frame-ancestors 'none'` |
| Rate limiting | Postgres fixed-window limiter on public submission, login, signup, password reset and invitation endpoints; Vercel Firewall rules on top |
| Abuse of public surveys | Rate limit per hashed IP + survey, idempotent `submission_id`, honeypot field and minimum-time check, one-response-per-device cookie per survey (soft). Cloudflare Turnstile added only if abuse appears |
| Webhooks | Signature verification, timestamp tolerance, idempotency via `billing_events.provider_event_id` |
| File uploads (logos) | Supabase Storage, size limit, MIME + magic-byte check, SVG disallowed (or sanitized), per-organization path with storage RLS |
| Secrets | Never `NEXT_PUBLIC_`; `server-only` imports; secret scanning on GitHub |
| Auditing | `audit_logs` for sensitive actions |
| Errors | Friendly localized messages; stack traces only in Sentry |

**Privacy:** customer identity optional and stored separately (`response_contacts`); no IPs or full user agents stored; PII scrubbed before Sentry, PostHog and AI calls; retention period configurable per organization (job deletes old contact data); export and deletion built on the same structure later.

---

## 9. Testing and delivery

- **Unit** (Vitest): scoring (CSAT/NPS), formatters (SAR, numbers, dates), permission matrix, Zod schemas, provider adapters with mocks.
- **Database** (pgTAP): every RLS policy, `submit_response()` validation, invitation and ownership rules.
- **Integration** (Vitest against a local Supabase): server actions end-to-end with real RLS.
- **E2E** (Playwright, run in Arabic **and** English, mobile and desktop): signup → verify → onboarding → organization → location → survey → publish → open public survey → submit → see response in inbox and dashboard; coupon issue and redeem; subscription once Phase 8 lands.
- **CI** (GitHub Actions) on every PR: lint, typecheck, unit, i18n key parity, migrations applied to a fresh database, pgTAP, E2E, Lighthouse budget on the public survey.
- **Migrations:** `supabase migration new <name>` → write SQL → `supabase db reset` locally → PR → CI applies to staging on merge → manual approval promotes to production. Rollback = a new forward migration (documented runbook); destructive changes ship in two steps (expand, then contract).
- **Git:** `main` protected; work on `feature/…` and `fix/…` branches with conventional commits (`feat:`, `fix:`). In this cloud session I'm pinned to one branch (`claude/festive-mayer-itj3hl`), so I'll open one PR per phase from it.

---

## 10. Architectural risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | **Data residency (PDPL).** Supabase and Vercel do not, to my knowledge, host inside Saudi Arabia (verify the current region list). PDPL allows transfers abroad under conditions, but some customers (clinics, government-adjacent, enterprise) may require in-Kingdom hosting | Minimize personal data, never collect health information, keep the stack portable (plain Postgres + SQL migrations; Next.js can run outside Vercel). Get a legal opinion before selling to clinics |
| R2 | **Auth emails are single-language** in Supabase's built-in templates | Use Supabase's "send email" hook so our server sends Arabic/English auth emails via Resend |
| R3 | **Editing surveys corrupts history** | Immutable published versions (§4.1) |
| R4 | **Fake or spam responses** (including competitors) | §8 abuse controls; flag anomalies (burst of 1-star from one source) in the dashboard |
| R5 | **AI hallucination, Arabic dialect quality, cost** | Numbers come from SQL, AI only interprets and must cite evidence; batch processing; prompt versions stored; evaluation set of real Saudi-dialect feedback before launch |
| R6 | **Saudi billing compliance**: VAT 15% and ZATCA e-invoicing (Fatoora) for invoices issued by a VAT-registered business | Pick a payment/invoicing provider that supports ZATCA, or integrate a ZATCA-compliant invoicing service in Phase 8 |
| R7 | **Printed QR codes outlive domains** | Decide the permanent survey domain before businesses print; QR targets are short codes so a redirect can preserve old links |
| R8 | **Next.js 16 is newer than most documentation** | Follow the bundled docs in `node_modules/next/dist/docs` (per `AGENTS.md`) |
| R9 | **Development environment limits** (blocked hosts, no Supabase Docker images) | Allowlist hosts (§7); meanwhile test SQL on local Postgres; full integration tests run in CI |

---

## 11. Phase plan

| Phase | Scope | MVP? |
|---|---|---|
| 1 Foundation | Locale routing (ar default, en), RTL/LTR layout, i18n with typed keys, Supabase clients, auth (signup, verify, login, logout, reset), localized auth emails, `profiles`, env validation, security headers, Sentry + PostHog wiring, app shell, shadcn components styled to brand, CI, test harness | ✅ |
| 2 Business | Onboarding steps 1–4, organizations, locations, members, invitations, roles, RLS + tests, audit log | ✅ |
| 3 Surveys | Builder (rating, NPS, single/multiple choice, text; add/edit/delete/reorder, required, options, preview), versions, publish, links, QR (PNG/SVG/print/copy), public survey `/s/{code}`, submission, onboarding steps 5–7 | ✅ |
| 4 Feedback | Inbox (read, important, status, tags, search, filters) | ✅ |
| 5 Analytics | Dashboard KPIs (responses, average, CSAT, NPS, positive/negative), trends, location comparison, filters (dates, location, survey), question-level results | ✅ |
| 6 Coupons | Offers, unique codes after completion, redemption screen | ✅ |
| 7 AI | Launch: per-response sentiment + themes in batches, weekly summary with evidence. Later: emerging issues, location-specific insights | Reduced |
| 8 Billing | Plans as data, subscriptions via webhooks, entitlements/limits, billing page, VAT invoices | ✅ |
| 9 Production | Rate-limit tuning, email suite (weekly summary, alerts), security and performance review, E2E hardening, staging → production launch | ✅ |
| Future | Star/emoji/yes-no/dropdown questions, replies to customers, location-scoped roles, known customers/loyalty, POS integrations, public API + webhooks, Google/Microsoft/SSO login, Hijri dates, dark mode, data export/deletion self-service | — |

**Phase 1 starts after your approval** of this document and the decisions in §2.
