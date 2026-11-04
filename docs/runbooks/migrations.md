# Database migrations

Every schema change is a migration in `supabase/migrations/`. Never change a deployed database by hand.

## Create

```bash
npm run db:migration -- add_locations   # creates supabase/migrations/<timestamp>_add_locations.sql
```

Write plain SQL. For every new table: `id uuid primary key default gen_random_uuid()`, `created_at`,
`updated_at` (with the `private.set_updated_at()` trigger), `organization_id` on tenant data,
`enable row level security`, explicit policies, and explicit `revoke`/`grant` for `anon` and `authenticated`.
Add pgTAP tests in `supabase/tests/database/`.

## Run locally

```bash
npm run db:reset    # rebuilds the local database from all migrations (and seed.sql)
npm run db:test     # pgTAP tests
npm run db:types    # regenerate types/database.ts, then commit it
```

## Deploy

1. Open a pull request; CI applies all migrations to a fresh database and runs the tests.
2. After merge, apply to **staging**: `npx supabase link --project-ref <staging-ref> && npx supabase db push`.
3. Verify staging, then apply the same way to **production**.

## Roll back safely

Migrations only move forward. To undo a change, write a new migration that reverses it.
Destructive changes ship in two steps: first **expand** (add the new column/table, write to both,
backfill), deploy the app; then **contract** (drop the old one) in a later migration once nothing reads it.
Take a backup (Supabase dashboard → Database → Backups) before any destructive production migration.
