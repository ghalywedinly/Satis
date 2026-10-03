# Satis

Customer experience platform for physical businesses in Saudi Arabia: QR feedback surveys, CSAT, NPS and insights.
Arabic first, English second. **Satisfaction, measured. · رضا عملائك، بالأرقام.**

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Supabase (Postgres, Auth) · next-intl · Sentry · PostHog · Resend

## Get started

```bash
npm install
cp .env.example .env.local      # fill in values (docs/setup.md)
npm run db:start                # local Supabase (Docker); prints URL and keys
npm run dev                     # http://localhost:3000 (Arabic) and /en (English)
```

## Common commands

| | |
|---|---|
| `npm run lint` / `npm run typecheck` / `npm test` | Static checks and unit tests |
| `npm run db:test` | Migrations + database security (RLS) tests |
| `npm run test:e2e` | End-to-end tests in Arabic and English |
| `npm run db:migration -- <name>` | New database migration |

## Documentation

- [Architecture](docs/architecture-proposal.md) — design, schema, security, phases
- [Environment setup](docs/setup.md) — Supabase, Vercel, Resend, Sentry, PostHog
- [Testing](docs/testing.md) · [Migrations](docs/runbooks/migrations.md)
- [Brand rules](CLAUDE.md) · [Brand handoff](Satis%20Branding/design_handoff_satis_brand/README.md)

## Project layout

```
app/[locale]/(marketing|auth|app)   pages, Arabic at /, English at /en
app/auth/confirm, app/api/          email links, webhooks
modules/<domain>/                   server actions, schemas and UI per business area
components/                         ui (shadcn), brand, forms, app shell
lib/                                i18n, supabase, auth, env, email, rate limiting, observability
locales/ar, locales/en              every user-facing string
supabase/migrations, supabase/tests database schema and RLS tests
tests/unit, tests/e2e               Vitest and Playwright
```
