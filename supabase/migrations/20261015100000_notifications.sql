-- Notifications: an email when an unhappy customer answers, and a weekly report.
--   * notification_preferences: each member's own choices per business. No row means the
--     default for their role: owners, admins and managers get both; staff and viewers neither.
--   * notification_recipients(): server-only list of who should receive a given notification,
--     with the address and language to use.
-- Members manage only their own preferences; the server reads recipients with the service role.

create table public.notification_preferences (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  negative_alerts boolean not null,
  weekly_report boolean not null,
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  -- Preferences exist only while the person belongs to the business.
  foreign key (organization_id, user_id) references public.organization_members (organization_id, user_id) on delete cascade
);

create trigger notification_preferences_set_updated_at before update on public.notification_preferences
for each row execute function private.set_updated_at();

alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon, authenticated;

create policy "Members read their own notification preferences" on public.notification_preferences
for select to authenticated using (user_id = (select auth.uid()));
create policy "Members set their own notification preferences" on public.notification_preferences
for insert to authenticated with check (user_id = (select auth.uid()) and (select private.is_member(organization_id)));
create policy "Members change their own notification preferences" on public.notification_preferences
for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select on public.notification_preferences to authenticated;
grant insert (organization_id, user_id, negative_alerts, weekly_report) on public.notification_preferences to authenticated;
grant update (negative_alerts, weekly_report) on public.notification_preferences to authenticated;

-- Server: who receives a notification of the given kind for a business, honouring preferences.
create function public.notification_recipients(p_organization_id uuid, p_kind text)
returns table (user_id uuid, email text, locale public.app_locale, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, u.email::text, coalesce(p.locale, 'ar'), p.full_name
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  left join public.notification_preferences n on n.organization_id = m.organization_id and n.user_id = m.user_id
  where m.organization_id = p_organization_id
    and u.email is not null
    and case p_kind
      when 'negative_alert' then coalesce(n.negative_alerts, m.role in ('owner', 'admin', 'manager'))
      when 'weekly_report' then coalesce(n.weekly_report, m.role in ('owner', 'admin', 'manager'))
      else false
    end;
$$;

revoke execute on function public.notification_recipients(uuid, text) from public, anon, authenticated;
grant execute on function public.notification_recipients(uuid, text) to service_role;

-- The weekly report reuses the dashboard's numbers, computed by the server for each business.
grant execute on function public.get_analytics(uuid, timestamptz, timestamptz, uuid, uuid) to service_role;
