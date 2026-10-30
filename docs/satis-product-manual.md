# Satis: product manual

> Reference document for people and AI assistants. Read it fully before answering questions about Satis, writing copy, designing for it, or planning features.
> Status labels: **[Live]** built and working · **[Planned]** agreed next work · **[Idea]** discussed, not decided.
> Last updated: October 2026.

---

## 1. Satis in one paragraph

Satis (ساتيس) is an Arabic-first customer satisfaction platform for businesses in Saudi Arabia. A business places a QR code at each of its locations; customers scan it with their phone camera and rate their visit in a few seconds, without downloading an app or creating an account. The business sees every response in an inbox, tracks satisfaction (CSAT) and loyalty (NPS) per location on a dashboard, gets an email the moment a customer is unhappy, receives an AI summary of what customers praise and complain about, and can reward customers with a discount code to bring them back.

- **Tagline:** "Satisfaction, measured." / "رضا عملائك، بالأرقام."
- **Category:** customer feedback / CSAT / NPS / customer experience (CX) software, sold as a monthly subscription (SaaS).
- **Market:** Saudi Arabia first (Arabic primary, English supported). Wider Gulf later.
- **Stage:** working product with early access; billing not yet switched on.

---

## 2. Who it is for

**Target businesses:** consumer-facing businesses with physical locations or online orders:
restaurants, cafés, retail stores, clinics, beauty salons and spas, hotels, gyms, entertainment venues, and (with planned additions) e-commerce brands.

**Ideal first customer:** a Saudi business with 1–20 branches that wants to know how each branch is doing and catch unhappy customers before they leave a bad Google review or never return.

**Words Satis uses:**
- **Customers** = the business's shoppers/visitors who answer surveys. They never log in.
- **Teams** = the business's staff who use the Satis dashboard. (Never call them "users" in product copy.)
- **Business** = an organization/account in Satis. One person can belong to several businesses.
- **Location** = a branch, store or site of a business. Each has its own QR code.

---

## 3. The problem and the value

**Problem:** most unhappy customers don't complain; they just don't come back. Owners with several branches can't be everywhere, paper comment cards don't work, and Google reviews arrive too late and are public.

**What Satis gives the business:**
1. A fast, private channel for customer feedback at every location.
2. Clear numbers per location: CSAT, NPS, response volume, trends vs the previous period.
3. Instant alerts for unhappy customers, so the team can fix things the same day.
4. AI that reads every comment and tells the owner the top themes (praise and complaints).
5. A reward (discount code) that gives customers a reason to return.

**Why customers actually answer:** it takes under a minute, it opens in the phone browser, it's in Arabic by default, and it can offer a reward.

---

## 4. How it works (end to end)

### 4.1 Business setup (about 2 minutes) [Live]
1. Sign up with full name, email and password; confirm the email.
2. Onboarding wizard:
   1. Business name.
   2. Business type: restaurant, café, retail, clinic, beauty, hotel, gym, entertainment, other.
   3. First location: name (e.g., "Jeddah - Tahlia") and city.
   4. Create and publish a ready-made survey (or skip).
   5. QR code for that location is shown, ready to download or print.
   6. Tips on where to place it: by the cashier, on tables or menus, near the exit or on receipts.
3. Land on the dashboard.

### 4.2 The customer's experience [Live]
1. Scans the QR code (or opens the survey link).
2. The survey opens in the browser, in Arabic by default, with a one-tap switch to English.
3. Answers a few questions (typically a 1–5 rating, what they liked, a 0–10 recommendation score and an optional comment).
4. Sees a thank-you message, and a discount code if the business offers a reward.
5. No app, no sign-up, no personal details asked.

### 4.3 What the business does next [Live]
- Watches the dashboard for scores and trends.
- Works the inbox: read, mark important, tag, set status (new / in progress / resolved).
- Gets an email right away when a customer is unhappy, and a weekly report every Sunday.
- Redeems customers' discount codes at the counter.

---

## 5. Features in detail

### 5.1 Surveys [Live]
- **Ready-made template ("Post-visit survey"):**
  1. "How was your visit today?" (1–5 rating; this is the CSAT question)
  2. "What did you like?" (multiple choice: quality of service, staff friendliness, speed of service, cleanliness, value for money)
  3. "How likely are you to recommend us to a friend?" (0–10, NPS)
  4. "Is there anything else you'd like to tell us?" (open comment)
  5. Thank-you message.
- **Question types:** rating (1–5), NPS (0–10), single choice, multiple choice, open text.
- **Limits:** up to 10 questions per survey, 10 options per question, comments up to 1,000 characters.
- **Bilingual:** every question can have Arabic and English text; the survey can be Arabic-only, English-only or both.
- **Editing and publishing:** draft, then publish. Published versions are frozen, so editing never mixes up old answers; publish again to update.
- **One survey, many locations:** each location gets its own link and QR code, so every answer is tied to where it came from.

### 5.2 Survey design and branding [Live]
- **Accent colours:** Ultramarine, Ember, Mint, Grape, Ink.
- **Backgrounds:** Sand, White, Ink (dark), Tint.
- **Rating styles:** slices (Satis signature), stars, faces (drawn, not emoji), numbers, hearts.
- **Presets:** Classic, Warm, Fresh, Night, Playful.
- Every style records the same 1–5 number, so analytics never depend on the look.

### 5.3 QR codes and sharing [Live]
- A unique QR code and short link per location (and per survey).
- Download or print from the share page.

### 5.4 Feedback inbox [Live]
- All responses in one list with the score, comment, location and time.
- **Filters:**
  - status: new, in progress, resolved
  - sentiment: positive, neutral or negative, based on the score
  - survey, location, tag, AI topic
  - period: last 7, 30 or 90 days, or all time
  - unread only, important only, with comments only
- **Search** inside what customers wrote.
- **Triage:** mark read or unread, mark important, add tags, change status.
- **Response detail page** with all answers and AI themes.

### 5.5 Analytics dashboard [Live]
- **Periods:** today, last 7, 30 or 90 days, or a custom range. Filter by location and survey.
- **Key numbers:**
  - Responses.
  - CSAT: share of ratings that are 4 or 5, plus the average out of 5.
  - NPS: promoters minus detractors, from −100 to +100.
  - Share of responses with comments.
- Each number is compared with the previous period (up, down or no change).
- **Charts:** responses and satisfaction per day.
- **Location comparison:** best and weakest branch, with a "needs attention" highlight. Each question's results are broken down.
- **Highlights:** top branch, and unhappy customers still waiting for follow-up.

### 5.6 Rewards / coupons [Live]
- A business creates a reward offer for a survey, optionally only for one location:
  - percent off (1–100%) or a fixed amount
  - validity of 1–365 days (default 30)
  - optional usage limit and a note
- After submitting the survey, the customer gets a unique code on the thank-you screen.
- Staff redeem codes on a **redeem screen**. A code can be used once, and expired codes are rejected.
- Only one active reward per survey at a time; offers can be paused.

### 5.7 AI insights [Live]
- **Comment analysis:** every written comment is read nightly and tagged with sentiment and topics, split into praise and complaints (e.g., "wait time", "staff friendliness"). Managers can also run it on demand ("Analyze now", limited to a few runs per hour).
- **Weekly summary:** every Sunday morning (Saudi time), a short headline and summary of the week in Arabic and English, shown on the dashboard and in the weekly email.
- **Topic filter in the inbox** and topic counts on the dashboard.
- **Privacy:** emails, phone numbers and links are removed from comments before they're sent to the AI.
- **Model:** Claude (Anthropic), run with Satis's own API key.

### 5.8 Notifications [Live]
- **Unhappy-customer alert:** an email right after a low score (rating 1–2, or NPS 0–6 when there's no rating), with the comment and a link to the response. Capped at 20 per business per hour.
- **Weekly report (Sunday):**
  - responses, CSAT, NPS and comments vs last week
  - best and weakest location
  - unhappy customers still open
  - the AI summary
- **Defaults:** owners, admins and managers get both by default. Each member can turn each one on or off on the Notifications page.
- Sent in each person's chosen language.

### 5.9 Team and roles [Live]
| Role | Can do |
|---|---|
| Owner | Everything, including transferring ownership |
| Admin | Edit the business, manage members, read the audit log, plus everything below |
| Manager | Manage locations, surveys and rewards, plus everything below |
| Staff | Triage feedback (read, tag, change status) and redeem coupons |
| Viewer | Read only |

- **Invitations** go out by email. Ownership can't be granted by invitation, and a business always keeps at least one owner.
- **Multiple businesses:** one person can belong to several and switch between them.
- **Audit log** of important changes.

### 5.10 Book a meeting (sales) [Live]
- **Landing page:** the main call to action is "Book a meeting" (احجز موعدًا).
- **Booking page (/book):**
  1. Pick a day (next 10 working days, Sunday–Thursday) and a 30-minute slot between 10:00 and 17:00 Saudi time.
  2. Enter full name, email, mobile number and company.
- **No double booking:** a slot can only be booked once.
- **Confirmations:** the visitor gets a confirmation email with an "Add to Google Calendar" button. The Satis team is emailed too, when a notification address is set.
- **Where bookings live:** stored privately (the Supabase table `meeting_requests`).

### 5.11 Accounts and security [Live]
- **Sign-in:** email and password, with email confirmation, password reset, email change and sign-in links.
- **Languages:** Arabic at `/`, English at `/en`. The interface, emails and surveys follow each person's language.
- **Phone home screen:** Satis can be added to the phone home screen with its own icon.

---

## 6. Data, privacy and security

- **Separation:** each business's data is completely separate. The database itself enforces who can see what (row-level security), not just the app.
- **Customers stay anonymous:** surveys don't ask for personal details.
- **Analytics:** product analytics never contain names, emails or answers.
- **Rate limits** on sign-up, sign-in, survey submission, bookings and AI runs, plus hidden "honeypot" fields against bots.
- **Hosting:** Vercel (app) and Supabase (database, authentication). Error monitoring is Sentry; product analytics is PostHog; email is Resend.

---

## 7. Pricing

- **Current:** one plan, "Standard", at **150 SAR per month, excluding VAT**. It covers all features for all locations.
- **Early access:** businesses start free now and are told before billing begins.
- **Billing** (online payment) is not built yet [Planned, Phase 8; payment provider to be chosen].
- **Proposed tiers [Idea]:**
  - Starter 149 SAR (1 location)
  - Growth 349 SAR (up to 5 locations, AI, rewards)
  - Business from 899 SAR (unlimited locations, integrations, WhatsApp)
  - Plus about 79 SAR per extra location, yearly billing with 2 months free, a 14-day free trial, and AI usage limits per plan.

---

## 8. Brand identity (for copy and design)

- **Personality:** confident, clear, warm, data-driven. Arabic is primary, not a translation.
- **Colours:**

  | Name | Hex | Use |
  |---|---|---|
  | Ink | `#0B0D12` | Leads, about 44% of any layout |
  | Sand | `#FAF8F4` | Page background; cards are white |
  | Ultramarine | `#2B3AF3` | Primary actions, links, main data |
  | Ember | `#FF6B4A` | Energy, alerts, unhappy moments; text on it is Ink |
  | Zest | `#FFCF28` | Delight only (top score, selected rating), at most one per view, Ink text |
  | Mint | `#0FA968` | Positive change, promoters |
  | Grape | `#8B57C4` | Secondary data only |

- **Fonts:**
  - Bricolage Grotesque (headings, numbers, logo; bold, tight)
  - Instrument Sans (English body)
  - Readex Pro (Arabic)
- **Signature shape:** the "slice", a slanted parallelogram used for highlights, rating bars, dividers ("speed lines") and big cropped logo graphics.
- **Logo:** a stylised "S" mark made of slices plus the wordmark. Never stretched, outlined, rotated, recoloured or given effects.
- **Writing rules:**
  - sentence case
  - buttons are a verb plus an object ("Book a meeting", "Send feedback")
  - no emoji
  - Western digits in both languages (2,140; 92.4%, with no space before %)
- **Things to avoid:** gradients behind text, coloured shadows, stock photos.

---

## 9. Frequently asked questions

- **Do customers need an app?** No, the survey opens in the phone browser.
- **Is it in Arabic?** Yes, Arabic first, with one-tap English.
- **Multiple branches?** Yes. Each gets its own QR code and results, and they can be compared.
- **Can I edit questions?** Yes, start from the template and publish changes any time.
- **Is data safe?** Each business's data is isolated, only its team sees responses, and customers stay anonymous.
- **Setup time?** Minutes.
- **What does "CSAT" mean?** The share of customers who rated 4 or 5 out of 5.
- **What does "NPS" mean?** Promoters (9–10) minus detractors (0–6), from −100 to +100.
- **Can I see Google reviews in Satis?** Not yet [Idea].

---

## 10. Roadmap

### Planned / recommended next
1. **Industry presets and "areas" inside locations:**
   - hotel: restaurant, spa, rooms, reception
   - clinic: departments
   - restaurant: dine-in, drive-through, delivery

   Each area gets its own QR code, questions and score. Staff ratings come after that; hospitals later, with privacy care.
2. **More automated emails:**
   - welcome
   - setup reminders and first-response
   - meeting reminders and the meeting link
   - member joined, role changed, password changed
   - monthly report
   - rewards running low
   - billing emails
   - account deleted
   - win-back after inactivity
3. **E-commerce:**
   - online-store questions (delivery, packaging, matches photos)
   - Salla and Zid apps that send the survey automatically after delivery
   - order details on responses
   - WhatsApp sending
   - website pop-up
   - product ratings
4. **Billing (Phase 8)** and production readiness (Phase 9: own domain, monitoring, launch checklist).

### Ideas
- Google Maps reviews brought into the dashboard with the same AI analysis.
- Kiosk mode (a tablet at the counter).
- A bookings page inside Satis for the Satis team.
- Help and status pages on subdomains (`help.`, `status.`).

---

## 11. Positioning and messaging

- **One-line pitch (EN):** "Know how every branch is doing, and catch unhappy customers before they leave."
- **One-line pitch (AR):** "اعرف أداء كل فرع، والحق على العميل غير الراضي قبل ما يروح."
- **Hook idea:** "عميلك ما اشتكى… بس ما رجع." ("Your customer didn't complain… they just didn't come back.")
- **Main call to action:** "احجز موعدًا" / "Book a meeting" (30-minute call; the team sets up the first survey with you).
- **Differentiators:**
  - built for Saudi Arabia, in Arabic first
  - setup in minutes
  - no app for customers
  - per-branch comparison
  - instant unhappy-customer alerts
  - AI summaries
  - rewards that bring customers back
  - simple local pricing in SAR
- **Partnership strategy [Idea]:** list Satis on the Salla and Zid app marketplaces and prove traction first. Discuss deeper partnership or a small strategic investment later; don't give away control early.

---

## 12. Glossary

| Term | Meaning |
|---|---|
| Business | A company account in Satis |
| Location | A branch or site; has its own QR code |
| Survey | The questions customers answer; published as versions |
| Response | One customer's submitted answers |
| CSAT | Customer satisfaction: share of 4–5 ratings |
| NPS | Net Promoter Score: promoters minus detractors (−100 to 100) |
| Sentiment | Positive, neutral or negative, from the score (and from AI for comments) |
| Theme / topic | What a comment is about, found by AI |
| Reward / coupon | A discount code shown after the survey |
| Triage | Reading, tagging and resolving responses in the inbox |
| Customers | People answering surveys |
| Teams | Business staff using Satis |
