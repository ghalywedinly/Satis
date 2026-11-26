# Satis — Final Visual Identity (handoff for the coding agent)

Apply this identity to the Satis codebase: marketing site, merchant dashboard, merchant score widget and the public Satis Score pages. Tokens live in `tokens.css`; assets in `logo/` and `characters/`.

## 1. Logo — three planes, solid Zest
- S-mark: three slanted planes, all Zest #FFCF28. Polygons (viewBox 4 0 98 92):
  - top `40,4 98,4 68.3,30 10.3,30`
  - middle `11.1,34 57.1,34 94.9,58 48.9,58`
  - bottom `66,88 8,88 37.7,62 95.7,62`
- Wordmark "Satis": Bricolage Grotesque 700, letter-spacing -0.04em.
- On Ink: Zest mark + white wordmark. On white: Zest mark + Ink wordmark. On Zest: everything Ink (one colour).
- Files: `logo/mark-zest.svg`, `logo/mark-ink.svg`, `logo/lockup-on-ink.svg`, `logo/lockup-on-white.svg`, `logo/lockup-on-zest.svg`, `logo/app-icon.svg` (Ink rounded square, Zest mark).
- Never: outline, gradient, rotate, recolour planes individually.

## 2. Colour — four brand colours at equal weight
- Zest #FFCF28 · Ember #FF6B4A · Mint #0FA968 · Ultramarine #2B3AF3 (700 shades: #F5B800, #A8321F, #0D8B57, #1D28C9).
- Rotate them across sections; no single colour dominates. Amber is not a brand colour (only Zest's shade).
- Text on Zest/Ember/Mint is Ink. Text on Ultramarine/Ink is white.
- Status meaning in data: Mint = good, Zest = neutral/highlight, Ember = needs attention.

## 3. Page ground — clean white + Ink
- Page background #FFFFFF. Feature/hero sections #0B0D12. Subtle fills #F4F5F7. No sand.
- Cards: white, 20px radius, 1px #ECEEF2 hairline, no shadow at rest.

## 4. Rating — clean stars, 1–5
- Five classic 5-point stars; filled Zest #FFCF28, empty #E5DFD5 (on Ink: #3C4658).
- Scores shown as one decimal out of 5: **4.7**. Never percentages in customer-facing ratings.

## 5. Merchant widget — inline pill
- Pill (radius 999), white, soft shadow 0 6px 18px rgba(11,13,18,.10).
- Contents: small Ultramarine wavy seal with white S-mark · **4.7** (Bricolage 800) · 5 stars · "3,450 Satisfied customers · Verified by Satis".
- Arabic: "٣٬٤٥٠ عميل راضٍ · موثّق من ساتيس", full RTL mirror.

## 6. Illustration — characters + hard shadow
- Use the character PNGs in `characters/` (01 Faisal, 02 Noura, 07 Omar, 08 Reem, 09 Yousef poses).
- Place on flat brand grounds with `filter: drop-shadow(22px 22px 0 #0B0D12)` (or the ground's 700 shade).
- Pair with tilted UI cards (8–14°) carrying hard ink shadows. One light source top-left. No gradients, no blur. Yousef never on Zest grounds.

## 7. Typography
- Display/headings/numbers: Bricolage Grotesque 700/800, tracking -0.02em (headings) to -0.05em (big numerals).
- UI/body: Instrument Sans 400/500/600. Arabic: Readex Pro 500/600/700. Code: JetBrains Mono.
- Eyebrow: 12px, uppercase, 0.10em, 600, muted. Sentence case everywhere else.

## 8. Public product name — Satis Score · تقييم ساتيس
- Replaces "Satis Index" everywhere (routes, nav, widget, awards copy).

## Constants
- Radii: 6 chips · 10 controls · 14 tiles · 20 cards · 28 media · 40 hero · pill badges.
- Icons: Lucide, stroke 1.75. No emoji.
- Motion: 140ms state, 200ms entrance, ease cubic-bezier(.2,.8,.2,1); respect prefers-reduced-motion.
- Bilingual EN/AR, RTL-ready. Numbers with comma separators (3,450).

## Reference designs (in the design project)
Satis Final Identity · Satis Identity Picker · Satis Website Home · Satis Features Section · Satis Dashboard v2 · Satis Index v4 Leaderboard · Satis CSAT Widget Styles · Satis Characters.
