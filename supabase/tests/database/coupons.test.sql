begin;
select plan(27);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'owner@example.com'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'outsider@example.com'),
  ('cccccccc-0000-0000-0000-00000000000c', 'viewer@example.com'),
  ('dddddddd-0000-0000-0000-00000000000d', 'staff@example.com');

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;
grant execute on function pg_temp.act_as(uuid) to authenticated;

set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.create_organization('Nora Café', 'cafe', 'ar', 'Tahlia');
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select public.create_organization('Other Gym', 'gym', 'en', 'Riyadh');
reset role;

insert into public.organization_members (organization_id, user_id, role)
select id, 'cccccccc-0000-0000-0000-00000000000c'::uuid, 'viewer'::public.org_role from public.organizations where name = 'Nora Café'
union all
select id, 'dddddddd-0000-0000-0000-00000000000d'::uuid, 'staff'::public.org_role from public.organizations where name = 'Nora Café';
insert into public.locations (organization_id, name) select id, 'Corniche' from public.organizations where name = 'Nora Café';

insert into public.surveys (organization_id, name, locales, default_locale, questions)
select id, 'Post-visit', '{ar}', 'ar',
  '[{"id": "11111111-1111-1111-1111-111111111111", "type": "rating", "required": false, "role": "csat", "title": {"ar": "التقييم"}}]'::jsonb
from public.organizations where name = 'Nora Café';
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.publish_survey((select id from public.surveys where name = 'Post-visit'));
reset role;
insert into public.survey_links (organization_id, survey_id, location_id, public_code)
select s.organization_id, s.id, l.id, case l.name when 'Tahlia' then 'TahliaCode' else 'CornicheCd' end
from public.surveys s join public.locations l on l.organization_id = s.organization_id;

create temp table ids as select
  (select id from public.organizations where name = 'Nora Café') as org,
  (select id from public.organizations where name = 'Other Gym') as other_org,
  (select id from public.surveys where name = 'Post-visit') as survey,
  (select id from public.locations where name = 'Tahlia') as tahlia,
  (select id from public.locations where name = 'Riyadh') as other_loc,
  (select current_version_id from public.surveys where name = 'Post-visit') as version;
grant select on ids to authenticated, service_role;

create function pg_temp.respond(code text, n int) returns uuid language sql as $$
  select public.submit_survey_response(code, (select version from ids), ('99999999-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid, 'ar',
    '{"11111111-1111-1111-1111-111111111111": {"number": 5}}', 'mobile');
$$;
grant execute on function pg_temp.respond(text, int) to service_role;

-- ───── Offers ─────
set local role service_role;
create temp table r0 as select pg_temp.respond('TahliaCode', 1) as id;
grant select on r0 to anon;
select is(public.issue_coupon((select id from r0)), null, 'no reward is issued while the survey has no offer');
reset role;

set local role authenticated;
select pg_temp.act_as('cccccccc-0000-0000-0000-00000000000c');
select throws_ok(
  $$insert into public.coupon_offers (organization_id, survey_id, discount_type, discount_value) values ((select org from ids), (select survey from ids), 'percent', 15)$$,
  '42501', null, 'viewers cannot create offers'
);
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select throws_ok(
  $$insert into public.coupon_offers (organization_id, survey_id, discount_type, discount_value) values ((select org from ids), (select survey from ids), 'percent', 150)$$,
  '23514', null, 'a percentage above 100 is rejected'
);
select throws_ok(
  $$insert into public.coupon_offers (organization_id, survey_id, location_id, discount_type, discount_value) values ((select org from ids), (select survey from ids), (select other_loc from ids), 'percent', 15)$$,
  '23503', null, 'an offer cannot point at another business''s location'
);
select lives_ok(
  $$insert into public.coupon_offers (organization_id, survey_id, location_id, discount_type, discount_value, note, valid_days, usage_limit)
    values ((select org from ids), (select survey from ids), (select tahlia from ids), 'percent', 15, '{"ar": "على أي مشروب"}', 30, 2)$$,
  'managers can create an offer for one location'
);
select throws_ok(
  $$insert into public.coupon_offers (organization_id, survey_id, discount_type, discount_value) values ((select org from ids), (select survey from ids), 'amount', 2000)$$,
  '23505', null, 'a survey has one active offer at a time'
);
select is((select count(*)::int from public.audit_logs where action = 'coupon_offers.insert'), 1, 'creating an offer is audited');
reset role;

-- ───── Issuing (as the server) ─────
set local role service_role;
create temp table c1 as select public.issue_coupon(pg_temp.respond('TahliaCode', 2)) as j;
grant select on c1 to authenticated;
select ok((select j ->> 'code' ~ '^[A-HJ-NP-Z2-9]{8}$' from c1), 'a completed response gets an 8-character code');
select is((select j - 'code' - 'expiresAt' from c1), '{"discountType": "percent", "discountValue": 15, "note": {"ar": "على أي مشروب"}}'::jsonb, 'the coupon carries the reward');
select ok((select (j ->> 'expiresAt')::timestamptz between now() + interval '29 days' and now() + interval '31 days' from c1), 'it expires after the offer''s valid days');
select is(
  (select public.issue_coupon(id) ->> 'code' from public.survey_responses where submission_id = '99999999-0000-0000-0000-000000000002'),
  (select j ->> 'code' from c1), 'issuing again for the same response returns the same code'
);
select is(public.issue_coupon(pg_temp.respond('CornicheCd', 3)), null, 'responses at other locations get no reward from a one-location offer');
select isnt(public.issue_coupon(pg_temp.respond('TahliaCode', 4)), null, 'a second customer gets a code');
select is(public.issue_coupon(pg_temp.respond('TahliaCode', 5)), null, 'no more codes once the usage limit is reached');
select is((select count(distinct code)::int from public.coupon_issuances), 2, 'every code is unique');
reset role;

set local role anon;
select throws_ok(format('select public.issue_coupon(%L)', (select id from r0)), '42501', null, 'browsers cannot issue codes');
reset role;

-- ───── Redeeming ─────
set local role authenticated;
select pg_temp.act_as('dddddddd-0000-0000-0000-00000000000d');
select is(
  (select public.lookup_coupon((select org from ids), lower(substr(j ->> 'code', 1, 4) || '-' || substr(j ->> 'code', 5))) ->> 'status' from c1),
  'valid', 'staff can look up a code, ignoring case and dashes'
);
select is((public.lookup_coupon((select org from ids), 'ZZZZZZZZ') ->> 'status'), 'not_found', 'unknown codes are reported');
select is(
  (select public.redeem_coupon((select org from ids), j ->> 'code', (select tahlia from ids)) ->> 'status' from c1),
  'redeemed', 'staff can redeem a valid code'
);
select throws_ok(
  format('select public.redeem_coupon(%L, %L)', (select org from ids), (select j ->> 'code' from c1)),
  'P0001', 'coupon_redeemed', 'a code cannot be used twice'
);
reset role;
select is(
  (select redeemed_by::text || '/' || (redeemed_location_id = (select tahlia from ids))::text from public.coupon_issuances where code = (select j ->> 'code' from c1)),
  'dddddddd-0000-0000-0000-00000000000d/true', 'who redeemed it, and where, is recorded'
);
update public.coupon_issuances set expires_at = now() - interval '1 minute' where code <> (select j ->> 'code' from c1);
set local role authenticated;
select pg_temp.act_as('dddddddd-0000-0000-0000-00000000000d');
select throws_ok(
  format('select public.redeem_coupon(%L, (select code from public.coupon_issuances where redeemed_at is null))', (select org from ids)),
  'P0001', 'coupon_expired', 'expired codes cannot be redeemed'
);

select pg_temp.act_as('cccccccc-0000-0000-0000-00000000000c');
select throws_ok(
  format('select public.redeem_coupon(%L, %L)', (select org from ids), 'ABCDEFGH'),
  '42501', null, 'viewers cannot redeem'
);
select is((select count(*)::int from public.coupon_issuances), 2, 'viewers can see issued codes');

select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.coupon_issuances), 0, 'outsiders cannot see another business''s codes');
select throws_ok(
  format('select public.lookup_coupon(%L, %L)', (select org from ids), (select j ->> 'code' from c1)),
  '42501', null, 'outsiders cannot look up another business''s codes'
);
select is(
  (public.lookup_coupon((select other_org from ids), (select j ->> 'code' from c1)) ->> 'status'),
  'not_found', 'a code is only valid at the business that issued it'
);
reset role;

select * from finish();
rollback;
