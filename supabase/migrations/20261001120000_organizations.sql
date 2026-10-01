-- Phase 2: multi-tenancy. Organizations (businesses), their locations, members with roles,
-- invitations, and an audit log.
--
-- Security model:
--   * Every tenant table carries organization_id and has RLS enabled.
--   * Reads go through RLS policies built on private.is_member / private.has_role.
--   * Membership and invitation changes go ONLY through the security-definer functions below,
--     which enforce the role rules; signed-in users have no direct write access to those tables.
--   * Functions raise exceptions whose message is a stable error code (e.g. 'forbidden') that
--     the app maps to translated messages.

-- Functions in "private" are not callable unless explicitly granted.
revoke execute on all functions in schema private from public;
alter default privileges in schema private revoke execute on functions from public;
grant usage on schema private to authenticated;

create type public.org_role as enum ('owner', 'admin', 'manager', 'staff', 'viewer');
create type public.business_type as enum (
  'restaurant', 'cafe', 'retail', 'clinic', 'beauty', 'hotel', 'gym', 'entertainment', 'other'
);

create function private.role_rank(r public.org_role)
returns integer
language sql
immutable
set search_path = ''
as $$
  select case r
    when 'owner' then 5
    when 'admin' then 4
    when 'manager' then 3
    when 'staff' then 2
    else 1
  end
$$;

create function private.is_valid_timezone(tz text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (select 1 from pg_catalog.pg_timezone_names where name = tz)
$$;

-- ───────── Tables ─────────

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  business_type public.business_type not null,
  default_locale public.app_locale not null default 'ar',
  timezone text not null default 'Asia/Riyadh' check (private.is_valid_timezone(timezone)),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.organizations is 'A business (tenant). Everything a business owns references it.';
comment on column public.organizations.default_locale is 'Default language for customer-facing surveys.';

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.org_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- "Which organizations can this user see" runs inside every RLS check.
create index organization_members_user_id_idx on public.organization_members (user_id);

create table public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email = lower(btrim(email)) and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' and char_length(email) <= 254),
  role public.org_role not null check (role <> 'owner'),
  -- SHA-256 of the token in the invitation link; the token itself is never stored.
  token_hash text not null unique check (char_length(token_hash) = 64),
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_invitations_organization_id_idx on public.organization_invitations (organization_id);
-- At most one open invitation per email per organization.
create unique index organization_invitations_pending_email_idx
  on public.organization_invitations (organization_id, email)
  where accepted_at is null and revoked_at is null;

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 120),
  city text check (char_length(city) <= 80),
  address text check (char_length(address) <= 200),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index locations_organization_id_idx on public.locations (organization_id);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is 'Append-only record of sensitive changes. Written by triggers only; never contains personal data.';
create index audit_logs_organization_created_idx on public.audit_logs (organization_id, created_at desc);

create trigger organizations_set_updated_at before update on public.organizations
for each row execute function private.set_updated_at();
create trigger organization_members_set_updated_at before update on public.organization_members
for each row execute function private.set_updated_at();
create trigger organization_invitations_set_updated_at before update on public.organization_invitations
for each row execute function private.set_updated_at();
create trigger locations_set_updated_at before update on public.locations
for each row execute function private.set_updated_at();

-- ───────── Role helpers used by policies ─────────

create function private.current_role_in(org uuid)
returns public.org_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.organization_members
  where organization_id = org and user_id = (select auth.uid())
$$;

create function private.is_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = (select auth.uid())
  )
$$;

create function private.has_role(org uuid, minimum public.org_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(private.role_rank(private.current_role_in(org)) >= private.role_rank(minimum), false)
$$;

grant execute on function private.role_rank(public.org_role) to authenticated;
grant execute on function private.is_valid_timezone(text) to authenticated;
grant execute on function private.current_role_in(uuid) to authenticated;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.has_role(uuid, public.org_role) to authenticated;

-- ───────── Row Level Security ─────────

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.locations enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.organizations, public.organization_members, public.organization_invitations,
  public.locations, public.audit_logs from anon, authenticated;

-- Organizations: members read; admins edit basic details.
create policy "Members can read their organizations" on public.organizations
for select to authenticated using ((select private.is_member(id)));
create policy "Admins can update their organization" on public.organizations
for update to authenticated
using ((select private.has_role(id, 'admin')))
with check ((select private.has_role(id, 'admin')));
grant select on public.organizations to authenticated;
grant update (name, business_type, default_locale) on public.organizations to authenticated;

-- Members: visible to everyone in the same organization; changed through functions only.
create policy "Members can read their team" on public.organization_members
for select to authenticated using ((select private.is_member(organization_id)));
grant select on public.organization_members to authenticated;

-- Invitations: admins read (without the token hash); changed through functions only.
create policy "Admins can read invitations" on public.organization_invitations
for select to authenticated using ((select private.has_role(organization_id, 'admin')));
grant select (id, organization_id, email, role, invited_by, expires_at, accepted_at, revoked_at, created_at, updated_at)
  on public.organization_invitations to authenticated;

-- Locations: members read; managers and above add and edit (archive instead of delete).
create policy "Members can read locations" on public.locations
for select to authenticated using ((select private.is_member(organization_id)));
create policy "Managers can add locations" on public.locations
for insert to authenticated with check ((select private.has_role(organization_id, 'manager')));
create policy "Managers can update locations" on public.locations
for update to authenticated
using ((select private.has_role(organization_id, 'manager')))
with check ((select private.has_role(organization_id, 'manager')));
grant select on public.locations to authenticated;
grant insert (organization_id, name, city, address) on public.locations to authenticated;
grant update (name, city, address, archived_at) on public.locations to authenticated;

-- Audit log: admins read; written by triggers only.
create policy "Admins can read the audit log" on public.audit_logs
for select to authenticated using ((select private.has_role(organization_id, 'admin')));
grant select on public.audit_logs to authenticated;

-- ───────── Invariants ─────────

-- An organization always keeps at least one owner (except while the organization itself is being deleted).
create function private.protect_last_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.role = 'owner'
     and (tg_op = 'DELETE' or new.role <> 'owner')
     and exists (select 1 from public.organizations where id = old.organization_id)
     and not exists (
       select 1 from public.organization_members
       where organization_id = old.organization_id and role = 'owner' and id <> old.id
     )
  then
    raise exception 'last_owner' using errcode = 'P0001';
  end if;
  return coalesce(new, old);
end;
$$;

create trigger organization_members_protect_last_owner
before update of role or delete on public.organization_members
for each row execute function private.protect_last_owner();

-- ───────── Audit trail ─────────

create function private.write_audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  row_data jsonb := to_jsonb(coalesce(new, old));
  org uuid := case when tg_table_name = 'organizations' then (row_data ->> 'id')::uuid
                   else (row_data ->> 'organization_id')::uuid end;
  details jsonb := '{}'::jsonb;
begin
  -- Rows removed by an organization deletion have nothing left to attach to.
  if not exists (select 1 from public.organizations where id = org) then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    details := jsonb_build_object('changed', (
      select coalesce(jsonb_agg(key order by key), '[]'::jsonb)
      from jsonb_each(to_jsonb(new)) n
      where key <> 'updated_at' and n.value is distinct from to_jsonb(old) -> key
    ));
  end if;
  if tg_table_name = 'organization_members' then
    details := details || jsonb_strip_nulls(jsonb_build_object(
      'role', row_data ->> 'role',
      'previous_role', case when tg_op = 'UPDATE' then to_jsonb(old) ->> 'role' end
    ));
  elsif tg_table_name = 'organization_invitations' then
    details := details || jsonb_build_object('role', row_data ->> 'role');
  end if;

  insert into public.audit_logs (organization_id, actor_id, action, entity_type, entity_id, metadata)
  values (org, (select auth.uid()), tg_table_name || '.' || lower(tg_op), tg_table_name, (row_data ->> 'id')::uuid, details);
  return null;
end;
$$;

create trigger organizations_audit after update on public.organizations
for each row execute function private.write_audit();
create trigger organization_members_audit after insert or update or delete on public.organization_members
for each row execute function private.write_audit();
create trigger organization_invitations_audit after insert or update on public.organization_invitations
for each row execute function private.write_audit();
create trigger locations_audit after insert or update on public.locations
for each row execute function private.write_audit();

-- ───────── Functions callable by signed-in users ─────────

-- Creates a business with the caller as owner, plus its first location (onboarding).
create function public.create_organization(
  p_name text,
  p_business_type public.business_type,
  p_default_locale public.app_locale,
  p_location_name text,
  p_location_city text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  org_id uuid;
begin
  if uid is null then
    raise exception 'not_authenticated' using errcode = 'P0001';
  end if;
  if (select count(*) from public.organizations where created_by = uid) >= 20 then
    raise exception 'limit_reached' using errcode = 'P0001';
  end if;

  insert into public.organizations (name, business_type, default_locale, created_by)
  values (btrim(p_name), p_business_type, p_default_locale, uid)
  returning id into org_id;

  insert into public.organization_members (organization_id, user_id, role)
  values (org_id, uid, 'owner');

  insert into public.locations (organization_id, name, city)
  values (org_id, btrim(p_location_name), nullif(btrim(p_location_city), ''));

  return org_id;
end;
$$;

-- Team list with names and emails, for members of the organization only.
create function public.list_organization_members(p_organization_id uuid)
returns table (member_id uuid, user_id uuid, role public.org_role, full_name text, email text, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.id, m.user_id, m.role, p.full_name, u.email::text, m.created_at
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  where m.organization_id = p_organization_id
    and private.is_member(p_organization_id)
  order by private.role_rank(m.role) desc, m.created_at
$$;

create function public.change_member_role(p_member_id uuid, p_role public.org_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.organization_members;
  caller public.org_role;
begin
  select * into target from public.organization_members where id = p_member_id;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  caller := private.current_role_in(target.organization_id);

  if caller is null or private.role_rank(caller) < private.role_rank('admin') then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if target.user_id = (select auth.uid()) then
    raise exception 'cannot_change_self' using errcode = 'P0001';
  end if;
  -- Only owners can grant or take away ownership.
  if (target.role = 'owner' or p_role = 'owner') and caller <> 'owner' then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  update public.organization_members set role = p_role where id = p_member_id;
end;
$$;

create function public.remove_member(p_member_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target public.organization_members;
  caller public.org_role;
begin
  select * into target from public.organization_members where id = p_member_id;
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
  caller := private.current_role_in(target.organization_id);

  if caller is null or private.role_rank(caller) < private.role_rank('admin') then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if target.user_id = (select auth.uid()) then
    raise exception 'cannot_change_self' using errcode = 'P0001';
  end if;
  if target.role = 'owner' and caller <> 'owner' then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  delete from public.organization_members where id = p_member_id;
end;
$$;

create function public.leave_organization(p_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.organization_members
  where organization_id = p_organization_id and user_id = (select auth.uid());
  if not found then raise exception 'not_found' using errcode = 'P0001'; end if;
end;
$$;

-- The application generates the token, emails the link, and passes only its SHA-256 here.
create function public.create_invitation(p_organization_id uuid, p_email text, p_role public.org_role, p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  normalized text := lower(btrim(p_email));
  invitation_id uuid;
begin
  if not private.has_role(p_organization_id, 'admin') then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if p_role = 'owner' then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if exists (
    select 1 from public.organization_members m join auth.users u on u.id = m.user_id
    where m.organization_id = p_organization_id and lower(u.email) = normalized
  ) then
    raise exception 'already_member' using errcode = 'P0001';
  end if;
  if (select count(*) from public.organization_invitations
      where organization_id = p_organization_id and accepted_at is null and revoked_at is null and expires_at > now()) >= 50 then
    raise exception 'limit_reached' using errcode = 'P0001';
  end if;

  -- A new invitation replaces any open one for the same email.
  update public.organization_invitations set revoked_at = now()
  where organization_id = p_organization_id and email = normalized and accepted_at is null and revoked_at is null;

  insert into public.organization_invitations (organization_id, email, role, token_hash, invited_by)
  values (p_organization_id, normalized, p_role, p_token_hash, (select auth.uid()))
  returning id into invitation_id;
  return invitation_id;
end;
$$;

create function public.revoke_invitation(p_invitation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  org uuid;
begin
  select organization_id into org from public.organization_invitations
  where id = p_invitation_id and accepted_at is null and revoked_at is null;
  if org is null then raise exception 'not_found' using errcode = 'P0001'; end if;
  if not private.has_role(org, 'admin') then raise exception 'forbidden' using errcode = 'P0001'; end if;
  update public.organization_invitations set revoked_at = now() where id = p_invitation_id;
end;
$$;

-- What the invitation page shows before accepting. Only to the invited person.
create function public.get_invitation(p_token_hash text)
returns table (organization_name text, role public.org_role, email text, status text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name, i.role, i.email,
    case
      when i.revoked_at is not null then 'revoked'
      when i.accepted_at is not null then 'accepted'
      when i.expires_at <= now() then 'expired'
      when i.email <> lower(coalesce((select auth.jwt()) ->> 'email', '')) then 'email_mismatch'
      else 'pending'
    end
  from public.organization_invitations i
  join public.organizations o on o.id = i.organization_id
  where i.token_hash = p_token_hash
$$;

create function public.accept_invitation(p_token_hash text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  invitation public.organization_invitations;
  uid uuid := (select auth.uid());
begin
  if uid is null then raise exception 'not_authenticated' using errcode = 'P0001'; end if;

  select * into invitation from public.organization_invitations where token_hash = p_token_hash for update;
  if not found or invitation.revoked_at is not null then
    raise exception 'not_found' using errcode = 'P0001';
  end if;
  if invitation.accepted_at is not null then
    raise exception 'already_used' using errcode = 'P0001';
  end if;
  if invitation.expires_at <= now() then
    raise exception 'expired' using errcode = 'P0001';
  end if;
  if invitation.email <> lower(coalesce((select auth.jwt()) ->> 'email', '')) then
    raise exception 'email_mismatch' using errcode = 'P0001';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (invitation.organization_id, uid, invitation.role)
  on conflict (organization_id, user_id) do nothing;

  update public.organization_invitations set accepted_at = now(), accepted_by = uid where id = invitation.id;
  return invitation.organization_id;
end;
$$;

revoke execute on function
  public.create_organization(text, public.business_type, public.app_locale, text, text),
  public.list_organization_members(uuid),
  public.change_member_role(uuid, public.org_role),
  public.remove_member(uuid),
  public.leave_organization(uuid),
  public.create_invitation(uuid, text, public.org_role, text),
  public.revoke_invitation(uuid),
  public.get_invitation(text),
  public.accept_invitation(text)
from public, anon;

grant execute on function
  public.create_organization(text, public.business_type, public.app_locale, text, text),
  public.list_organization_members(uuid),
  public.change_member_role(uuid, public.org_role),
  public.remove_member(uuid),
  public.leave_organization(uuid),
  public.create_invitation(uuid, text, public.org_role, text),
  public.revoke_invitation(uuid),
  public.get_invitation(text),
  public.accept_invitation(text)
to authenticated;
