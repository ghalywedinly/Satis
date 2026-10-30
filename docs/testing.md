# Testing

| Command | What it runs | Needs |
|---|---|---|
| `npm run lint` | ESLint, including the no-hardcoded-text and RTL-safe-class rules | — |
| `npm run typecheck` | TypeScript across app, tests and config | — |
| `npm test` | Unit tests (Vitest), including Arabic/English translation parity | — |
| `npm run db:test` | Migrations + pgTAP tests (RLS, triggers, functions) on the local Supabase stack | Docker |
| `npm run db:test:local` | The same tests on a throwaway PostgreSQL, for machines without Docker | PostgreSQL 16 + pgTAP |
| `npm run test:e2e` | Playwright, desktop and mobile, Arabic and English | App + Supabase stack |

## End-to-end tests locally

```bash
npm run db:start                 # local Supabase; auth emails go to Mailpit (http://127.0.0.1:54324)
# put the URL and keys from `npx supabase status` into .env.local (see .env.example),
# plus RATE_LIMIT_DISABLED=true so repeated sign-ups aren't rate limited
npm run build && npm run test:e2e
```

The tests read verification and reset links from Mailpit. Set `E2E_EMAIL_OUTBOX` instead to read
them from the app's development outbox (`EMAIL_OUTBOX_DIR`), when emails are sent through the hook.

## Rules

- Every database change ships with pgTAP tests for its RLS policies: a member of one organization
  must never read or write another organization's rows.
- Critical flows get an end-to-end test that runs in both languages.
- `RATE_LIMIT_DISABLED` and `EMAIL_OUTBOX_DIR` are development-only; deployed environments refuse to start with them.
