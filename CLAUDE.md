@AGENTS.md

# Satis — brand rules for Claude Code

Satis is a **customer satisfaction platform** (feedback surveys, CSAT, NPS, sentiment) for consumer brands, embedded across app, POS and web. Tagline: **"Satisfaction, measured."** / **"رضا عملائك، بالأرقام."**

**Visual identity: follow `design/satis-identity-handoff/README.md`** (tokens in `tokens.css`, logos in `logo/`, characters in `characters/`). Where older docs (`Satis Branding/…`) or code disagree with it, the handoff wins. The customer-facing score is called **Satis Score · تقييم ساتيس** (not "Satis Index").

## Engineering rules (see `docs/architecture-proposal.md`)
- **Text:** never hardcode UI text. Every string lives in `locales/ar/*.json` and `locales/en/*.json` (same keys, enforced by `npm test` and the `react/jsx-no-literals` lint rule). Arabic is primary, not a translation afterthought.
- **Direction:** logical classes only (`ms-/me-/ps-/pe-/start-/end-/text-start/text-end`); lint rejects `ml-/mr-/pl-/pr-/left-/right-/text-left/text-right`. Directional icons get `rtl:-scale-x-100`. Emails, codes and URLs inside Arabic text use `<bdi dir="ltr">`.
- **Numbers and dates:** Western digits in both languages. Format with `lib/i18n/format` (`formatNumber`, `formatPercent`, `formatSar`, `formatDate`, `formatCount`) and pass the formatted **string** into `t()`; never pass raw numbers, which ICU would render as Arabic-Indic digits.
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
- Arabic headings keep line-height ≥ 1.4 so lines never touch (enforced in `globals.css`; don't override it with `leading-*` on Arabic text).
- Headings, numerals, logo: `font-display` (Bricolage Grotesque 700/800, negative tracking). Body/UI: `font-sans` (Instrument Sans). Arabic: Readex Pro with tracking 0, applied automatically to anything inside `lang="ar"` (see `globals.css`).
- Sentence case everywhere. Buttons are verb + object ("Send feedback", "Book a demo"). No emoji. Digits with commas (2,140). Percent with no space (92.4%).
- Say **customers** (the brand's shoppers) and **teams** (merchant users). Never "users" in UI copy.

## Colour roles (from the identity handoff)
- Four brand colours at **equal weight**, rotated across sections: **Zest #FFCF28**, **Ember #FF6B4A**, **Mint #0FA968**, **Ultramarine #2B3AF3** (700 shades: #F5B800, #A8321F, #0D8B57, #1D28C9).
- Text on Zest, Ember and Mint is Ink; text on Ultramarine and Ink is white. Mint text on white uses #0A6F45.
- Ground: page **white #FFFFFF**, feature sections **Ink #0B0D12**, subtle fills **#F4F5F7**. **No sand.** Cards white, 20px radius, 1px #ECEEF2 border, no shadow.
- Ultramarine stays the colour of primary buttons, links and focus.
- Data status: Mint = good, Zest = neutral, Ember = needs attention.
- Logo: the S-mark is all Zest. On Ink: Zest mark + white wordmark. On white: Zest mark + Ink wordmark. On Zest: all Ink.
- Customer-facing ratings: five stars (filled Zest, empty #E5DFD5, or #3C4658 on Ink) and one decimal out of 5 (4.7). **Never percentages in customer-facing ratings**; percentages are fine in team dashboards.
- No gradients. No coloured shadows; illustrations and tilted cards use hard Ink shadows (`drop-shadow(22px 22px 0 #0B0D12)`). Yousef is never placed on Zest.

## Brand elements (`components/brand/slice.tsx`)
- `SliceHighlight` — slanted plate behind a word/score. `RatingSlices` — 1–5 scale in slices. `Supergraphic` — giant cropped mark (marketing only). `OutlinedCard` / `OutlinedPill` — 3px ink-outlined white cards floating over Ember/Ink (marketing hero only, not dashboard). `SpeedLines` — dividers.
- Utilities: `slice`, `slice-sm|md|lg` (clip-path parallelogram), `eyebrow`.

## Design skill
`.claude/skills/design-taste-frontend-v1` guides layout, motion and polish. Where it conflicts with this file, this file wins: brand colours (Ultramarine for primary actions), fonts (Bricolage Grotesque, Instrument Sans, Readex Pro), lucide-react icons, CSS motion with reduced-motion support, Arabic-first RTL, and no new dependencies without a reason.

## UI defaults
- Controls radius 10px, cards 20px with 1px `border-border` and **no shadow at rest**; dialogs 28px.
- Hover darkens one step (500 → 600); press moves 1px down; focus = 3px ring `#B6BEFB`. Never remove focus.
- Motion: 140ms state, 200ms enter, 320ms progress; `ease-[var(--ease-standard)]`. `--ease-pop` only for delight moments (top score submitted). Respect reduced motion.
- Icons: lucide-react, stroke 1.75, size 16/20/24, `currentColor`.
