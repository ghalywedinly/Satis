-- Fixed-window rate limiting backed by Postgres (no Redis needed at this scale).
-- Keys are hashed by the application (never raw IP addresses).

create table private.rate_limits (
  key text not null,
  window_start timestamptz not null,
  hits integer not null default 1,
  primary key (key, window_start)
);

comment on table private.rate_limits is 'Request counters per hashed key and time window. Old windows are purged by a scheduled job.';

-- Records one hit and reports whether the caller is still within the limit.
-- Exposed through the Data API for the server (service role) only.
create or replace function public.consume_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_window timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  current_hits integer;
begin
  if p_key is null or char_length(p_key) > 200 or p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid rate limit arguments' using errcode = '22023';
  end if;

  insert into private.rate_limits as rl (key, window_start)
  values (p_key, current_window)
  on conflict (key, window_start) do update set hits = rl.hits + 1
  returning rl.hits into current_hits;

  return current_hits <= p_limit;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

create or replace function private.purge_rate_limits()
returns void
language sql
set search_path = ''
as $$
  delete from private.rate_limits where window_start < now() - interval '1 day';
$$;
