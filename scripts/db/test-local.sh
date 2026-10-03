#!/usr/bin/env bash
# Apply all migrations to a throwaway PostgreSQL and run the pgTAP tests.
# For machines without Docker. With Docker, prefer: npx supabase start && npx supabase test db
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
PG_BIN="${PG_BIN:-$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)}"
WORK="$(mktemp -d)"
PORT="${PORT:-54329}"
RUN=()
if [ "$(id -u)" = "0" ]; then RUN=(runuser -u postgres --); chown postgres "$WORK"; fi

cleanup() { "${RUN[@]}" "$PG_BIN/pg_ctl" -D "$WORK/data" -m immediate stop >/dev/null 2>&1 || true; rm -rf "$WORK"; }
trap cleanup EXIT

"${RUN[@]}" "$PG_BIN/initdb" -D "$WORK/data" -U postgres --auth=trust >/dev/null
"${RUN[@]}" "$PG_BIN/pg_ctl" -D "$WORK/data" -o "-p $PORT -k $WORK" -l "$WORK/log" start -w >/dev/null

PSQL=(psql -h "$WORK" -p "$PORT" -U postgres -d postgres -v ON_ERROR_STOP=1 -q)
"${PSQL[@]}" -f "$ROOT/scripts/db/supabase-stub.sql"
for migration in "$ROOT"/supabase/migrations/*.sql; do
  echo "migrate  $(basename "$migration")"
  "${PSQL[@]}" -f "$migration"
done

pg_prove -h "$WORK" -p "$PORT" -U postgres -d postgres "$ROOT"/supabase/tests/database/*.sql
