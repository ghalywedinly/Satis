begin;
select plan(9);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'owner@example.com'),
  ('cccccccc-0000-0000-0000-00000000000c', 'staff@example.com'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'outsider@example.com');

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;
grant execute on function pg_temp.act_as(uuid) to authenticated;

set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.create_organization('Nora Café', 'cafe', 'ar', 'Tahlia');
reset role;
-- A staff member, added directly (invitation flows are covered elsewhere).
insert into public.organization_members (organization_id, user_id, role)
select id, 'cccccccc-0000-0000-0000-00000000000c', 'staff' from public.organizations;
update public.profiles set locale = 'en' where id = 'cccccccc-0000-0000-0000-00000000000c';

create temp table org as select id from public.organizations;
grant select on org to authenticated, service_role;

-- ───── Defaults by role ─────
set local role service_role;
select results_eq(
  $$select email from public.notification_recipients((select id from org), 'negative_alert')$$,
  array['owner@example.com'],
  'by default owners get unhappy-customer alerts and staff do not'
);
select results_eq(
  $$select email from public.notification_recipients((select id from org), 'weekly_report')$$,
  array['owner@example.com'],
  'by default owners get the weekly report'
);
reset role;

-- ───── Members choose for themselves ─────
set local role authenticated;
select pg_temp.act_as('cccccccc-0000-0000-0000-00000000000c');
select lives_ok(
  $$insert into public.notification_preferences (organization_id, user_id, negative_alerts, weekly_report)
    values ((select id from org), 'cccccccc-0000-0000-0000-00000000000c', true, false)$$,
  'staff can turn alerts on for themselves'
);
select throws_ok(
  $$insert into public.notification_preferences (organization_id, user_id, negative_alerts, weekly_report)
    values ((select id from org), 'aaaaaaaa-0000-0000-0000-00000000000a', false, false)$$,
  '42501', null, 'nobody can change another member''s preferences'
);
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select lives_ok(
  $$insert into public.notification_preferences (organization_id, user_id, negative_alerts, weekly_report)
    values ((select id from org), 'aaaaaaaa-0000-0000-0000-00000000000a', true, false)$$,
  'owners can turn the weekly report off'
);
select is((select count(*)::int from public.notification_preferences), 1, 'members only see their own preferences');

select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select throws_ok(
  $$insert into public.notification_preferences (organization_id, user_id, negative_alerts, weekly_report)
    values ((select id from org), 'bbbbbbbb-0000-0000-0000-00000000000b', true, true)$$,
  '42501', null, 'outsiders cannot subscribe to a business'
);
select throws_ok($$select * from public.notification_recipients((select id from org), 'negative_alert')$$, '42501', null, 'members cannot list recipients');
reset role;

set local role service_role;
select results_eq(
  $$select email || ':' || locale from public.notification_recipients((select id from org), 'negative_alert') order by email$$,
  array['owner@example.com:ar', 'staff@example.com:en'],
  'preferences override the defaults, and each recipient keeps their language'
);
reset role;

select * from finish();
rollback;
