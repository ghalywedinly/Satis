begin;
select plan(11);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'owner@example.com'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'outsider@example.com');

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

insert into public.locations (organization_id, name)
select id, 'Corniche' from public.organizations where name = 'Nora Café';

insert into public.surveys (organization_id, name, locales, default_locale, questions)
select id, 'Post-visit', '{ar}', 'ar', '[
  {"id": "11111111-1111-1111-1111-111111111111", "type": "rating", "required": false, "role": "csat", "title": {"ar": "التقييم"}},
  {"id": "22222222-2222-2222-2222-222222222222", "type": "nps", "required": false, "title": {"ar": "التوصية"}},
  {"id": "33333333-3333-3333-3333-333333333333", "type": "multiple_choice", "required": false, "title": {"ar": "ما الذي أعجبك؟"},
   "options": [{"id": "44444444-4444-4444-4444-444444444444", "label": {"ar": "الخدمة"}}, {"id": "55555555-5555-5555-5555-555555555555", "label": {"ar": "السعر"}}]}
]'::jsonb from public.organizations where name = 'Nora Café';
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.publish_survey((select id from public.surveys where name = 'Post-visit'));
reset role;
insert into public.survey_links (organization_id, survey_id, location_id, public_code)
select s.organization_id, s.id, l.id, case l.name when 'Tahlia' then 'TahliaCode' else 'CornicheCd' end
from public.surveys s join public.locations l on l.organization_id = s.organization_id;

create temp table ids as select
  (select id from public.organizations where name = 'Nora Café') as org,
  (select id from public.surveys where name = 'Post-visit') as survey,
  (select id from public.locations where name = 'Tahlia') as tahlia,
  (select current_version_id from public.surveys where name = 'Post-visit') as version;
grant select on ids to authenticated, service_role;

-- Five responses: four this week (Saudi days 1–3 March), one the week before.
set local role service_role;
select public.submit_survey_response('TahliaCode', (select version from ids), '99999999-0000-0000-0000-000000000001', 'ar',
  '{"11111111-1111-1111-1111-111111111111": {"number": 5}, "22222222-2222-2222-2222-222222222222": {"number": 10},
    "33333333-3333-3333-3333-333333333333": {"options": ["44444444-4444-4444-4444-444444444444", "55555555-5555-5555-5555-555555555555"]}}', 'mobile');
select public.submit_survey_response('TahliaCode', (select version from ids), '99999999-0000-0000-0000-000000000002', 'ar',
  '{"11111111-1111-1111-1111-111111111111": {"number": 4}, "22222222-2222-2222-2222-222222222222": {"number": 8},
    "33333333-3333-3333-3333-333333333333": {"options": ["44444444-4444-4444-4444-444444444444"]}}', 'mobile');
select public.submit_survey_response('CornicheCd', (select version from ids), '99999999-0000-0000-0000-000000000003', 'ar',
  '{"11111111-1111-1111-1111-111111111111": {"number": 2}, "22222222-2222-2222-2222-222222222222": {"number": 3}}', 'mobile');
select public.submit_survey_response('CornicheCd', (select version from ids), '99999999-0000-0000-0000-000000000004', 'ar',
  '{"22222222-2222-2222-2222-222222222222": {"number": 9}}', 'mobile');
select public.submit_survey_response('TahliaCode', (select version from ids), '99999999-0000-0000-0000-000000000005', 'ar',
  '{"11111111-1111-1111-1111-111111111111": {"number": 1}}', 'mobile');
reset role;

-- 23:30 Saudi time on 1 March is still 1 March, though it's 20:30 UTC.
update public.survey_responses set submitted_at = case right(submission_id::text, 1)
  when '1' then '2026-03-01 20:30:00+00'
  when '2' then '2026-03-01 09:00:00+00'
  when '3' then '2026-03-03 09:00:00+00'
  when '4' then '2026-03-03 10:00:00+00'
  else '2026-02-25 09:00:00+00' end::timestamptz;

-- The week of 1–7 March, Saudi time.
create temp table win as select '2026-02-28 21:00:00+00'::timestamptz as f, '2026-03-07 21:00:00+00'::timestamptz as t;
grant select on win to authenticated;

set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
create temp table tr as select public.get_dashboard_trends((select org from ids), (select f from win), (select t from win)) as j;

select is((select jsonb_array_length(j -> 'current') from tr), 7, 'the current series has every day of the period');
select is((select jsonb_array_length(j -> 'previous') from tr), 7, 'the previous series has as many days');
select is((select j -> 'current' -> 0 from tr),
  '{"day": "2026-03-01", "responses": 2, "comments": 0, "csatCount": 2, "csatSatisfied": 2, "csatSum": 9, "npsCount": 2, "promoters": 1, "detractors": 0}'::jsonb,
  'days are Saudi calendar days with rating sums');
select is((select j -> 'previous' -> 3 from tr),
  '{"day": "2026-02-25", "responses": 1, "comments": 0, "csatCount": 1, "csatSatisfied": 0, "csatSum": 1, "npsCount": 0, "promoters": 0, "detractors": 0}'::jsonb,
  'the previous series lines up day by day with the current one');
select is((select j -> 'previous' -> 0 ->> 'day' from tr), '2026-02-22', 'the previous series starts one period earlier');
select is((select jsonb_array_length(j -> 'busyHours') from tr), 4, 'busy hours group this period by weekday and Saudi hour');
select is(
  (select h from tr, jsonb_array_elements(j -> 'busyHours') h where (h ->> 'dow')::int = 2 and (h ->> 'hour')::int = 12),
  '{"dow": 2, "hour": 12, "responses": 1, "negative": 1}'::jsonb,
  'low ratings are counted per hour (Tuesday 12:00 Saudi time)');
select is(
  (select (h ->> 'responses')::int from tr, jsonb_array_elements(j -> 'busyHours') h where (h ->> 'dow')::int = 0 and (h ->> 'hour')::int = 23),
  1, '23:30 Saudi time stays on its Saudi day and hour');
select is(
  (select (s ->> 'csatSum')::int from tr, jsonb_array_elements(j -> 'locationScores') s where (s ->> 'id')::uuid = (select tahlia from ids)),
  9, 'rating sums per location cover this period only');

-- ───── Isolation ─────
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select is(
  (select public.get_dashboard_trends((select org from ids), (select f from win), (select t from win)) -> 'current' -> 0 ->> 'responses'),
  '0', 'outsiders see no responses from another business'
);
reset role;

set local role anon;
select throws_ok(
  $$select public.get_dashboard_trends(gen_random_uuid(), now() - interval '1 day', now())$$,
  '42501', null, 'anonymous visitors cannot read dashboard trends'
);
reset role;

select * from finish();
rollback;
