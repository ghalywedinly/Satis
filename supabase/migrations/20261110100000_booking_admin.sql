-- Managing "Book a meeting" requests inside Satis.
--   * platform_admins: the Satis team. Only they can see and manage bookings (visitors' contact
--     details). Added by hand (SQL editor), never through the app.
--   * meeting_requests gains a status (a small sales pipeline), the meeting link and notes.
--   * A cancelled booking frees its time slot for other visitors.

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from public, anon, authenticated;
grant select, insert, delete on public.platform_admins to service_role;

create function private.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.platform_admins where user_id = (select auth.uid()));
$$;

-- For the app to decide whether to show the Satis team's pages (the database enforces it anyway).
create function public.is_platform_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.is_platform_admin();
$$;

revoke execute on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

-- ───────── Bookings: status, link, notes ─────────

alter table public.meeting_requests
  add column status text not null default 'new'
    check (status in ('new', 'confirmed', 'held', 'customer', 'not_now', 'cancelled')),
  add column meeting_link text check (meeting_link ~ '^https://\S+$' and char_length(meeting_link) <= 500),
  add column notes text check (char_length(notes) <= 2000),
  add column updated_at timestamptz not null default now();

create trigger meeting_requests_set_updated_at before update on public.meeting_requests
for each row execute function private.set_updated_at();

-- One live booking per slot; a cancelled one no longer holds it.
alter table public.meeting_requests drop constraint meeting_requests_starts_at_key;
create unique index meeting_requests_live_slot_key on public.meeting_requests (starts_at) where status <> 'cancelled';
create index meeting_requests_starts_at_idx on public.meeting_requests (starts_at);

create policy "The Satis team reads bookings" on public.meeting_requests
for select to authenticated using ((select private.is_platform_admin()));
create policy "The Satis team manages bookings" on public.meeting_requests
for update to authenticated
using ((select private.is_platform_admin()))
with check ((select private.is_platform_admin()));
grant select on public.meeting_requests to authenticated;
grant update (status, meeting_link, notes) on public.meeting_requests to authenticated;

-- Taken times for the public booking page: cancelled bookings are free again.
create or replace function public.booked_meeting_slots(p_from timestamptz, p_to timestamptz)
returns setof timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select starts_at from public.meeting_requests
  where starts_at >= p_from and starts_at < p_to
    and status <> 'cancelled'
    and p_to - p_from <= interval '62 days'
  order by starts_at;
$$;
