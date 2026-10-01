# Setting up Satis environments

Satis runs as one Next.js app (Vercel) per environment, each with its own Supabase project.
Never point development or staging at the production database.

| Environment | Supabase project | Vercel | `APP_ENV` |
|---|---|---|---|
| Local development | local stack (`npm run db:start`) or `satis-dev` | `npm run dev` | `development` |
| Staging | `satis-staging` | Preview deployments | `staging` |
| Production | `satis-prod` | Production deployment | `production` |

Staging and production refuse to start if a required variable is missing (`lib/env/server.ts`).

## 1. Supabase project (repeat for staging and production)

1. Create the project in the region closest to Saudi Arabia that Supabase offers.
2. **Apply the schema**: `npx supabase link --project-ref <ref>` then `npx supabase db push` (see `docs/runbooks/migrations.md`).
3. **Authentication → Sign In / Providers → Email**: enable email sign-up, **Confirm email: on**,
   **Secure password change: on**, minimum password length **8**, password requirements **letters and digits**.
4. **Authentication → URL Configuration**: Site URL = the environment's site URL;
   Redirect URLs = `https://<site>/**`.
5. **Authentication → Hooks → Send Email hook**: type **HTTPS**, URL `https://<site>/api/hooks/auth-email`.
   Generate the secret there and store it as `AUTH_EMAIL_HOOK_SECRET` in Vercel.
   This is what sends verification and password-reset emails in Arabic or English.
6. **Project settings → API keys**: copy the publishable key (`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)
   and a secret key (`SUPABASE_SECRET_KEY`, server-only).

## 2. Resend (email)

Verify the sending domain (DNS records), create an API key, and set `RESEND_API_KEY` and
`EMAIL_FROM` (for example `Satis <no-reply@your-domain>`).

## 3. Sentry and PostHog

- Sentry: create a Next.js project; set `NEXT_PUBLIC_SENTRY_DSN`. For readable stack traces, also set
  `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT` in Vercel (build-time only).
- PostHog: create a project (EU cloud recommended); set `NEXT_PUBLIC_POSTHOG_KEY` and `POSTHOG_HOST`.

Browser traffic for both goes through our own domain (`/monitoring`, `/ingest`).

## 4. Vercel

Import the GitHub repository, then add every variable from `.env.example` for each environment.
Generate `RATE_LIMIT_SALT` with `openssl rand -hex 32` (different per environment).
Use the Pro plan before launch (Hobby is for non-commercial use).

## 5. GitHub

Protect `main`: require a pull request and passing **CI** checks before merging.
