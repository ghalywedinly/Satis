-- Meetings booked from the public site ("Book a meeting").
--   * meeting_requests: the visitor's details and the chosen time. This is Satis's own sales
--     pipeline, not a business's data, so it has no organization_id and no member can read it.
--     Only the server (service role) writes it, after validation and rate limiting.
--   * booked_meeting_slots(): the times already taken, and nothing else, so the public booking
--     page can hide them without exposing anyone's details.

create table public.meeting_requests (
  id uuid primary key default gen_random_uuid(),
  -- One meeting per slot: the unique index is what stops two visitors booking the same time.
  starts_at timestamptz not null unique,
  full_name text not null check (char_length(btrim(full_name)) between 2 and 120),
  email text not null check (char_length(email) between 3 and 254 and email like '%_@_%'),
  phone text not null check (phone ~ '^\+[0-9]{8,15}$'),
  company text not null check (char_length(btrim(company)) between 1 and 120),
  locale public.app_locale not null default 'ar',
  created_at timestamptz not null default now(),
  -- Slots start on the hour or half hour.
  check (extract(second from starts_at) = 0 and extract(minute from starts_at) in (0, 30))
);

comment on table public.meeting_requests is 'Sales meetings booked from the public site. Server-only: contains visitors'' contact details.';

alter table public.meeting_requests enable row level security;
revoke all on public.meeting_requests from public, anon, authenticated;
grant select, insert on public.meeting_requests to service_role;

create function public.booked_meeting_slots(p_from timestamptz, p_to timestamptz)
returns setof timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select starts_at from public.meeting_requests
  where starts_at >= p_from and starts_at < p_to
    -- A bounded window: the page asks for the next few weeks, never the whole table.
    and p_to - p_from <= interval '62 days'
  order by starts_at;
$$;

revoke execute on function public.booked_meeting_slots(timestamptz, timestamptz) from public;
grant execute on function public.booked_meeting_slots(timestamptz, timestamptz) to anon, authenticated, service_role;
