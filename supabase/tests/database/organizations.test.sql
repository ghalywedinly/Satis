begin;
select plan(43);

-- Users: Nora owns "Nora Café"; Faisal owns another business; Sara gets invited to Nora's.
insert into auth.users (id, email, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'nora@example.com', '{"full_name": "Nora"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'faisal@example.com', '{"full_name": "Faisal"}'),
  ('cccccccc-0000-0000-0000-000000000003', 'sara@example.com', '{"full_name": "Sara"}');

create function pg_temp.act_as(user_id uuid, email text) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'email', email, 'role', 'authenticated')::text, true);
$$;
grant execute on function pg_temp.act_as(uuid, text) to authenticated;

-- ───── Creating organizations ─────
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000001', 'nora@example.com');
select lives_ok(
  $$select public.create_organization('Nora Café', 'cafe', 'ar', 'Jeddah - Tahlia', 'Jeddah')$$,
  'a signed-in user can create a business'
);
select is((select count(*)::int from public.organizations), 1, 'the owner sees their business');
select is((select role::text from public.organization_members), 'owner', 'the creator is the owner');
select is((select name from public.locations), 'Jeddah - Tahlia', 'the first location is created with the business');

select pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000002', 'faisal@example.com');
select public.create_organization('Faisal Gym', 'gym', 'en', 'Riyadh - Olaya');

-- Remember ids (as superuser, bypassing RLS).
reset role;
create temp table ids as
select
  (select id from public.organizations where name = 'Nora Café') as nora_org,
  (select id from public.organizations where name = 'Faisal Gym') as faisal_org,
  (select id from public.locations where name = 'Jeddah - Tahlia') as nora_location;
grant select on ids to authenticated;
set local role authenticated;

-- ───── Isolation between businesses ─────
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000002', 'faisal@example.com');
select is((select count(*)::int from public.organizations), 1, 'a user sees only their own businesses');
select is((select count(*)::int from public.organizations where id = (select nora_org from ids)), 0, 'another business is invisible');
select is((select count(*)::int from public.locations where organization_id = (select nora_org from ids)), 0, 'another business''s locations are invisible');
select is((select count(*)::int from public.organization_members where organization_id = (select nora_org from ids)), 0, 'another business''s team is invisible');
select is((select count(*)::int from public.audit_logs where organization_id = (select nora_org from ids)), 0, 'another business''s audit log is invisible');
select is((select count(*)::int from public.list_organization_members((select nora_org from ids))), 0, 'the team list function returns nothing to outsiders');

update public.organizations set name = 'Hijacked' where id = (select nora_org from ids);
select throws_ok(
  $$insert into public.locations (organization_id, name) values ((select nora_org from ids), 'Fake branch')$$,
  '42501', null, 'outsiders cannot add locations'
);
select throws_ok(
  $$insert into public.organization_members (organization_id, user_id, role) values ((select nora_org from ids), 'bbbbbbbb-0000-0000-0000-000000000002', 'owner')$$,
  '42501', null, 'nobody can add themselves to a business directly'
);
select throws_ok(
  format('select public.create_invitation(%L, %L, %L, %L)', (select nora_org from ids), 'x@example.com', 'admin', repeat('a', 64)),
  'P0001', 'forbidden', 'outsiders cannot invite people'
);
reset role;
select is((select name from public.organizations where id = (select nora_org from ids)), 'Nora Café', 'outsiders cannot rename a business');
set local role authenticated;

-- ───── Invitations ─────
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000001', 'nora@example.com');
select lives_ok(
  format('select public.create_invitation(%L, %L, %L, %L)', (select nora_org from ids), ' Sara@Example.com ', 'manager', repeat('b', 64)),
  'an owner can invite someone'
);
select is((select email from public.organization_invitations), 'sara@example.com', 'invited emails are normalized');
select throws_ok(
  $$select token_hash from public.organization_invitations$$,
  '42501', null, 'token hashes are never readable'
);
select throws_ok(
  format('select public.create_invitation(%L, %L, %L, %L)', (select nora_org from ids), 'x@example.com', 'owner', repeat('c', 64)),
  'P0001', 'forbidden', 'nobody can be invited as owner'
);
select throws_ok(
  format('select public.create_invitation(%L, %L, %L, %L)', (select nora_org from ids), 'nora@example.com', 'admin', repeat('d', 64)),
  'P0001', 'already_member', 'existing members cannot be invited again'
);

-- Faisal (wrong email) cannot use Sara's invitation.
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-000000000002', 'faisal@example.com');
select is((select status from public.get_invitation(repeat('b', 64))), 'email_mismatch', 'the invitation page tells other accounts it is not for them');
select throws_ok(
  format('select public.accept_invitation(%L)', repeat('b', 64)),
  'P0001', 'email_mismatch', 'an invitation only works for the invited email'
);

-- Sara accepts.
select pg_temp.act_as('cccccccc-0000-0000-0000-000000000003', 'sara@example.com');
select is((select status from public.get_invitation(repeat('b', 64))), 'pending', 'the invited person sees a pending invitation');
select is(public.accept_invitation(repeat('b', 64)), (select nora_org from ids), 'the invited person can accept');
select is((select role::text from public.organization_members where user_id = 'cccccccc-0000-0000-0000-000000000003'), 'manager', 'they join with the invited role');
select throws_ok(
  format('select public.accept_invitation(%L)', repeat('b', 64)),
  'P0001', 'already_used', 'an invitation works only once'
);
select is((select count(*)::int from public.list_organization_members((select nora_org from ids))), 2, 'members can list their team');
select is(
  (select email from public.list_organization_members((select nora_org from ids)) where role = 'owner'), 'nora@example.com',
  'the team list includes emails'
);

-- ───── Manager permissions ─────
select lives_ok(
  $$insert into public.locations (organization_id, name, city) values ((select nora_org from ids), 'Riyadh - Olaya', 'Riyadh')$$,
  'managers can add locations'
);
select is((select count(*)::int from public.organization_invitations), 0, 'managers cannot see invitations');
select throws_ok(
  format('select public.create_invitation(%L, %L, %L, %L)', (select nora_org from ids), 'y@example.com', 'staff', repeat('e', 64)),
  'P0001', 'forbidden', 'managers cannot invite people'
);
update public.organizations set name = 'Renamed by manager' where id = (select nora_org from ids);
select is((select name from public.organizations where id = (select nora_org from ids)), 'Nora Café', 'managers cannot edit business details');
select is((select count(*)::int from public.audit_logs), 0, 'managers cannot read the audit log');
select throws_ok(
  format('select public.change_member_role(%L, %L)', (select id from public.organization_members where user_id = 'cccccccc-0000-0000-0000-000000000003'), 'admin'),
  'P0001', 'forbidden', 'members cannot promote themselves'
);

-- ───── Owner manages the team ─────
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000001', 'nora@example.com');
select lives_ok(
  format('select public.change_member_role(%L, %L)', (select id from public.organization_members where user_id = 'cccccccc-0000-0000-0000-000000000003'), 'viewer'),
  'the owner can change roles'
);
select throws_ok(
  format('select public.change_member_role(%L, %L)', (select id from public.organization_members where user_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'admin'),
  'P0001', 'cannot_change_self', 'nobody can change their own role'
);
select throws_ok(
  format('select public.leave_organization(%L)', (select nora_org from ids)),
  'P0001', 'last_owner', 'the last owner cannot leave'
);
select ok(
  (select count(*) from public.audit_logs where action = 'organization_members.update' and metadata ->> 'previous_role' = 'manager') = 1,
  'role changes are recorded in the audit log'
);
update public.organizations set name = 'Nora Café & Bakery' where id = (select nora_org from ids);
select is((select name from public.organizations where id = (select nora_org from ids)), 'Nora Café & Bakery', 'owners can edit business details');

-- ───── Viewer permissions ─────
select pg_temp.act_as('cccccccc-0000-0000-0000-000000000003', 'sara@example.com');
select throws_ok(
  $$insert into public.locations (organization_id, name) values ((select nora_org from ids), 'Not allowed')$$,
  '42501', null, 'viewers cannot add locations'
);
update public.locations set name = 'Renamed by viewer' where id = (select nora_location from ids);
select is((select name from public.locations where id = (select nora_location from ids)), 'Jeddah - Tahlia', 'viewers cannot edit locations');

-- ───── Removing members ─────
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-000000000001', 'nora@example.com');
select lives_ok(
  format('select public.remove_member(%L)', (select id from public.organization_members where user_id = 'cccccccc-0000-0000-0000-000000000003')),
  'the owner can remove a member'
);
select pg_temp.act_as('cccccccc-0000-0000-0000-000000000003', 'sara@example.com');
select is((select count(*)::int from public.organizations), 0, 'removed members lose access immediately');

-- ───── Anonymous visitors ─────
reset role;
set local role anon;
select throws_ok(
  $$select public.create_organization('Spam', 'other', 'ar', 'Spam')$$,
  '42501', null, 'anonymous visitors cannot create businesses'
);

select * from finish();
rollback;
