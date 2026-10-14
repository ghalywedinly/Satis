-- Phase 1 foundation: shared helpers and user profiles.

-- Helpers live in a schema that is not exposed through the Data API.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Keeps updated_at current on every table that has one.
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create type public.app_locale as enum ('ar', 'en');

-- One row per auth user. Supabase Auth owns credentials (auth.users); this holds app preferences.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  locale public.app_locale not null default 'ar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is 'Per-user application preferences. Created automatically for each auth user.';
comment on column public.profiles.locale is 'Dashboard and email language. Arabic by default.';

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;

-- Users read and update only their own profile. Rows are created by the trigger below,
-- and removed with the auth user, so there are no insert or delete policies.
create policy "Users can read their own profile"
on public.profiles for select
to authenticated
using (id = (select auth.uid()));

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, locale) on public.profiles to authenticated;

-- Create the profile when a user signs up, taking name and language from sign-up metadata.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_locale text := new.raw_user_meta_data ->> 'locale';
  requested_name text := nullif(btrim(new.raw_user_meta_data ->> 'full_name'), '');
begin
  insert into public.profiles (id, full_name, locale)
  values (
    new.id,
    left(requested_name, 120),
    case when requested_locale in ('ar', 'en') then requested_locale::public.app_locale else 'ar' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();
