@AGENTS.md

# Satis — brand rules for Claude Code

Satis is a **customer satisfaction platform** (feedback surveys, CSAT, NPS, sentiment) for consumer brands, embedded across app, POS and web. Tagline: **"Satisfaction, measured."** / **"رضا عملائك، بالأرقام."**

Full spec: `Satis Branding/design_handoff_satis_brand/README.md`. Visual reference: `Satis Branding/design_handoff_satis_brand/reference/Satis Brand Identity v4.dc.html`.

## Engineering rules (see `docs/architecture-proposal.md`)
- **Text:** never hardcode UI text. Every string lives in `locales/ar/*.json` and `locales/en/*.json` (same keys, enforced by `npm test` and the `react/jsx-no-literals` lint rule). Arabic is primary, not a translation afterthought.
- **Direction:** logical classes only (`ms-/me-/ps-/pe-/start-/end-/text-start/text-end`); lint rejects `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right`. Directional icons get `rtl:-scale-x-100`. Emails, codes and URLs inside Arabic text use `<bdi dir="ltr">`.
- **Routing:** Arabic at `/…`, English at `/en/…` (next-intl, `lib/i18n`). Use `Link`/`redirect` from `@/lib/i18n/navigation`, and `resolveLocale(params)` at the top of every page and layout.
- **Data access:** `createSupabaseServerClient()` (acts as the user, RLS applies). The admin client bypasses RLS: only for webhooks, jobs and rate limiting after the request is authorized.
- **Authorization:** check on the server **and** enforce with RLS. Never rely on the client.
- **Database:** every change is a migration in `supabase/migrations/` with pgTAP tests (`docs/runbooks/migrations.md`). Every tenant table has `organization_id`, RLS enabled, explicit grants.
- **Validation:** Zod on every server action/route; messages are `validation.*` keys.
- **Secrets:** server-only modules (`lib/env/server.ts`, `import "server-only"`); never `NEXT_PUBLIC_` a secret.
- **Privacy:** no personal data in analytics, logs or Sentry. Analytics events are listed in `lib/observability/analytics-events.ts`.
- **Next.js 16:** `middleware` is now `proxy.ts`; read `node_modules/next/dist/docs` before using an API.
- **Before pushing:** `npm run lint && npm run typecheck && npm test && npm run db:test` (or `db:test:local`), and `npm run test:e2e` for user-facing flows.

## Always
- Stack: Next.js App Router, TypeScript, Tailwind v4, shadcn/ui. Tokens live in `app/globals.css` (`@theme`) — use token classes (`bg-ink`, `text-ultramarine`, `bg-zest`, `font-display`, `rounded-card`), never raw hex in components.
- Logo: `<SatisLogo />` / `<SatisMark />` from `components/brand/satis-mark.tsx`. Never retype "Satis" as a logo, never stretch, outline, rotate, recolour outside the listed tones, or add effects.
- Headings, numerals, logo: `font-display` (Bricolage Grotesque 700/800, negative tracking). Body/UI: `font-sans` (Instrument Sans). Arabic: Readex Pro with tracking 0, applied automatically to anything inside `lang="ar"` (see `globals.css`).
- Sentence case everywhere. Buttons are verb + object ("Send feedback", "Book a demo"). No emoji. Digits with commas (2,140). Percent with no space (92.4%).
- Say **customers** (the brand's shoppers) and **teams** (merchant users). Never "users" in UI copy.

## Colour roles
- **Ink #0B0D12** leads (≈44%). **Sand #FAF8F4** page ground; cards are white.
- **Ultramarine #2B3AF3** — primary actions, links, focus, main data series.
- **Ember #FF6B4A** — energy: hero shapes, alerts, detractors. Text on Ember is Ink.
- **Zest #FFCF28** — delight only: top scores, selected rating, highlight plates. Always Ink text on it, max one Zest element per view.
- Mint = positive delta / promoters. Grape = segments / secondary data only.
- No gradients behind text. No coloured shadows.

## Brand elements (`components/brand/slice.tsx`)
- `SliceHighlight` — slanted plate behind a word/score. `RatingSlices` — 1–5 scale in slices. `Supergraphic` — giant cropped mark (marketing only). `OutlinedCard` / `OutlinedPill` — 3px ink-outlined white cards floating over Ember/Ink (marketing hero only, not dashboard). `SpeedLines` — dividers.
- Utilities: `slice`, `slice-sm|md|lg` (clip-path parallelogram), `eyebrow`.

## UI defaults
- Controls radius 10px, cards 20px with 1px `border-border` and **no shadow at rest**; dialogs 28px.
- Hover darkens one step (500 → 600); press moves 1px down; focus = 3px ring `#B6BEFB`. Never remove focus.
- Motion: 140ms state, 200ms enter, 320ms progress; `ease-[var(--ease-standard)]`. `--ease-pop` only for delight moments (top score submitted). Respect reduced motion.
- Icons: lucide-react, stroke 1.75, size 16/20/24, `currentColor`.
