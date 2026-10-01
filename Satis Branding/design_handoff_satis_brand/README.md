# Handoff: Satis brand identity → Next.js

## Overview
Brand identity and starter implementation for **Satis**, a customer satisfaction platform (post-visit surveys, CSAT, NPS, sentiment) for consumer brands. This package gives a Next.js + TypeScript + Tailwind v4 + shadcn/ui project everything it needs to apply the brand: tokens, fonts, logo components, brand-element components, SVG assets and written rules.

## About the design files
Files in `reference/` are **design references created in HTML**: prototypes showing the intended look, not production code. Recreate them in the Next.js codebase using its patterns (App Router, server components where possible, shadcn/ui primitives, Tailwind token classes). The files in `app/`, `components/`, `public/` and `tokens.json` **are** intended to be copied into the codebase.

## Fidelity
**High-fidelity.** Colours, type, radii, spacing and copy are final. Recreate pixel-accurately.

## Install
1. `npx create-next-app@latest` (TypeScript, Tailwind, App Router), then `npx shadcn@latest init`.
2. Replace `app/globals.css` with the one in this package (keep shadcn's `tw-animate-css` dependency: `npm i tw-animate-css`).
3. Add `app/fonts.ts`; apply `fontVariables` on `<html>` (see `app/layout.example.tsx`).
4. Copy `components/brand/*`, `public/brand/*`, `app/icon.svg`.
5. Copy `CLAUDE.md` to the repo root (or merge it into yours) so Claude Code follows the rules automatically.
6. `npm i lucide-react` for icons.

## Logo
- **Mark:** "sliced fold" S — three parallelogram slices separated by thin cuts. Geometry (viewBox `8 4 90 84`):
  - top `40,4 98,4 68.3,30 10.3,30`
  - middle `11.1,34 57.1,34 94.9,58 48.9,58`
  - bottom `66,88 8,88 37.7,62 95.7,62`
- **Wordmark:** "Satis" in Bricolage Grotesque 700, tracking −0.04em. Arabic: "ساتيس" in Readex Pro 700 (spelling to be confirmed by client).
- **Lockup:** mark height = 0.72 × wordmark font-size; gap = 0.22 × font-size. In RTL the mark sits on the right.
- **Clear space:** one cap-height (x) on all sides. **Minimum:** lockup 20px font-size; mark alone 16px; favicon uses white mark on Ultramarine tile.
- **Approved tones:** ink, ink-ultra (blue middle slice), ultra, sand, sand-zest, white, white-zest. Approved grounds: White, Sand, Ink, Ultramarine, Midnight, Zest (ink mark), Ember (ink mark), Mint (ink mark), Grape (white mark), Linen, Ultramarine-100 (midnight mark).
- **Don't:** outline, gradient-fill, rotate, re-slant, add shadows, or place Zest text on white.

## Colour
| Role | Token | Hex |
|---|---|---|
| Ink (lead, ≈44%) | `ink` | #0B0D12 |
| Sand (ground, ≈22%) | `sand` | #FAF8F4 |
| Ultramarine (primary, ≈16%) | `ultramarine` | #2B3AF3 |
| Ember (energy, ≈12%) | `ember` | #FF6B4A |
| Zest (delight, ≈6%) | `zest` | #FFCF28 |
| Midnight | `midnight` | #0C1252 |
| Mint (promoters, positive delta) | `mint` | #0FA968 |
| Grape (segments) | `grape` | #8B57C4 |
| Linen (print/editorial) | `linen` | #E5DFD5 |
Full ramps (50–900) are in `globals.css` as `--color-{family}-{step}` → classes like `bg-ultra-50`, `text-ink-500`.
Text secondary #5A606E · border subtle #E6E2DA · border default #DCE0E8 · focus ring #B6BEFB · positive text #0E8A5F · negative text #A8321F.

## Typography
- Display / headings / numerals: Bricolage Grotesque 700–800. Display ≥56px: −0.045em, line-height 0.92. Headings: −0.03em. Big numerals: tabular, unit at 0.5em in muted colour (`92.4<small>%</small>`).
- Body/UI: Instrument Sans 400/500/600, body 16–19px, line-height 1.5.
- Arabic: Readex Pro 400–700, tracking 0, line-height 1.2–1.3 for headings.
- Eyebrow: 12px, 600, uppercase, 0.10em, muted (`.eyebrow`).
- Mono: JetBrains Mono (hex values, API keys, codes).

## Brand elements
1. **Slice:** single band of the mark. CSS: `clip-path: polygon(o 0, 100% 0, calc(100% - o) 100%, 0 100%)`, where o ≈ 0.3em for text plates, 5/10/14px for 10/14/18px-tall bars.
2. **Supergraphic:** the mark at huge scale cropped off an edge (`<Supergraphic />`). Covers, hero, billboards, social.
3. **Slice frame:** photos masked to `polygon(30% 0, 100% 0, 70% 100%, 0 100%)`.
4. **Slice highlight:** `<SliceHighlight>CSAT 94%</SliceHighlight>`. Zest for delight, Ink for neutral.
5. **Rating scale:** `<RatingSlices value={4} />` — filled slices Ultramarine, selected Zest, empty ink-100 (ink-700 on dark).
6. **Pattern:** tone-on-tone mark repeat (46×43 tile, mark scaled 0.42). Packaging/merch/cards only, never UI.
7. **Build:** mark assembles slice by slice (top → middle → bottom, 200ms each, ease-entrance) for loaders and intros.
8. **Speed lines:** three slices 100% / 74% / 52%, last in Ultramarine.
9. **Outlined cards:** white, 3px ink border, 24px radius, floating over Ember/Ink in marketing heroes; pill tags 2px border.

## Screens / views (see reference file)
### Marketing hero (reference: Cover in v4)
- Ink section, 40px radius when inset. Announcement bar: Ultramarine, 12px vertical padding, 14px/600 white centred text.
- Nav: logo (sand + zest middle, 30px) · links 15px/500 #DCE0E8 gap 28px · "Log in" outline 1.5px sand, "Book a demo" sand fill ink text, 42px tall, radius 10.
- Two columns (min 440px each, gap 48px). Left: eyebrow "Customer satisfaction platform", H1 "Satisfaction, measured." clamp(52px, 7vw, 96px) 800, Arabic line Readex 700 clamp(28px, 3.4vw, 40px), body 19px #DCE0E8 max 520px: "Collect feedback across your app, POS and website. See how customers feel, store by store, and fix what matters first." CTAs: Zest "See Satis in action" 56px tall radius 12, 17px/700 ink; ghost "Read customer stories" 1.5px #3C4658 border.
- Right (540px tall): Ember supergraphic bleeding bottom-right; Ultramarine slice top-right; floating OutlinedCards — CSAT card (300px: store name 13px muted, "4.8" 56px/800, "/ 5 CSAT", RatingSlices 14px, three rows: Speed of service · Good / Staff friendliness · Excellent (zest slice chip) / Waiting time · Could improve in #A8321F); Sentiment card (190px: Positive 82% mint bar, Negative 6% ember bar, 8px pill bars on ink-100); pill "Top rated store"; NPS card (200px: "+18 NPS", "in 90 days", mint 2.5px sparkline).

### Customer survey (mobile, EN + AR RTL)
- Sand screen, 16px padding, 14px gap. Ink card radius 20, padding 18: eyebrow-ish 12px #B8BCC6 "Rate your visit · {Store}", question 28px/800 sand "How was your visit today?", labels Poor/Excellent 12px, RatingSlices sm on dark; small Ultramarine slice decor top corner (28% width, 30px tall).
- "What stood out?" list: white card radius 20, rows 14px/500, 14×16 padding, 1px #F0EDE6 dividers; values Good / Excellent (zest slice chip) / Could improve (#A8321F 600).
- Primary button full width 48px radius 10 Ultramarine "Send feedback" / "أرسل رأيك".
- Arabic strings: كيف كانت زيارتك اليوم؟ · ضعيف / ممتاز · ما الذي لفت انتباهك؟ · سرعة الخدمة · تعامل الموظفين · وقت الانتظار · يحتاج تحسين.

### Merchant dashboard tiles
- Card white radius 20, 1px #E6E2DA, padding 24. Eyebrow "CSAT score" + "Last 12 weeks". Value "92.4%" 48px/800 tabular; delta "+3.1 pts vs last 30 days" 13px/600 #0E8A5F. Bar chart: 12 bars skewed −18°, Ultramarine, latest bar Zest.
- Campaign row: 44px tile Zest-50 with mark, "Post-visit survey", "Live · 2,140 responses this week", status pill "Active" mint-50 bg / #0E8A5F text.

## Interactions & behaviour
- Buttons: hover one step darker (ultra-500 → ultra-600, zest-400 → zest-500); active translateY(1px) + `shadow-pressed`; focus `shadow-focus`; disabled 45% opacity.
- RatingSlices (interactive): radio group, arrow keys move selection, selected slice animates to Zest in 140ms; on submit of 5/5 allow one `--ease-pop` celebration.
- Marketing header: sticky; add 1px bottom border after 8px scroll; no blur.
- Respect `prefers-reduced-motion`.

## State (survey example)
`rating: number | null`, `aspects: Record<"speed"|"staff"|"wait", "poor"|"okay"|"good"|"excellent">`, `comment?: string`, `status: "idle"|"submitting"|"done"|"error"`. Submit via a Server Action; on error show "Couldn't send your feedback. Try again." with a retry button.

## Design tokens
All in `app/globals.css` and `tokens.json`: colours, fonts, radii (4/6/10/14/20/28/40/pill), shadows (xs–xl, pressed, focus), motion (80/140/200/320/560ms; standard/entrance/exit/pop easings), spacing (4px base; card 24, hero card 32, section 96, content max 1216, prose max 720).

## Assets
- `public/brand/mark-*.svg` — mark in every approved tone. `app-icon-ultra.svg`, `app-icon-ink.svg` (1024², square; let the OS mask). `app/icon.svg` — favicon (Next.js picks it up automatically).
- Fonts via `next/font/google` (Bricolage Grotesque, Instrument Sans, Readex Pro, JetBrains Mono). Readex Pro is a proposed Arabic face — swap if a licensed one exists.
- Photography: none supplied. Use real store/customer photos inside slice frames.

## Files
- `reference/Satis Brand Identity v4.dc.html` — full identity: logo, colour, type, elements, social, product UI, applications. Open in a browser (needs `reference/support.js`).
- `reference/Satis Logo Final.dc.html` — logo colourways and small sizes.
