begin;
select plan(22);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'owner@example.com'),
  ('cccccccc-0000-0000-0000-00000000000c', 'viewer@example.com');

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;
grant execute on function pg_temp.act_as(uuid) to authenticated;

set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.create_organization('Ward Café', 'cafe', 'ar', 'Olaya');
select public.create_organization('Quiet Gym', 'gym', 'en', 'Malqa');
reset role;

insert into public.organization_members (organization_id, user_id, role)
select id, 'cccccccc-0000-0000-0000-00000000000c', 'viewer' from public.organizations where name = 'Ward Café';
update public.locations set city = 'Riyadh';

insert into public.surveys (organization_id, name, locales, default_locale, questions)
select id, 'After visit', '{ar}', 'ar', '[
  {"id": "11111111-1111-1111-1111-111111111111", "type": "rating", "required": true, "role": "csat", "title": {"ar": "التقييم"}},
  {"id": "22222222-2222-2222-2222-222222222222", "type": "text", "required": false, "title": {"ar": "تعليقك"}}
]'::jsonb from public.organizations where name = 'Ward Café';
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.publish_survey((select id from public.surveys where name = 'After visit'));
reset role;

create temp table ids as select
  (select id from public.organizations where name = 'Ward Café') as org,
  (select id from public.surveys where name = 'After visit') as survey,
  (select current_version_id from public.surveys where name = 'After visit') as version,
  (select id from public.locations where name = 'Olaya') as location;
grant select on ids to authenticated, anon, service_role;

-- 24 ratings: 20 fives and 4 twos. One short of a public score.
insert into public.survey_responses (organization_id, survey_id, survey_version_id, location_id, submission_id, locale, csat_score, has_comment, comment_text)
select org, survey, version, location, gen_random_uuid(), 'ar', case when n <= 20 then 5 else 2 end, true, 'تعليق ' || n
from ids, generate_series(1, 24) as n;

-- A page needs an address first.
select throws_ok(
  $$ update public.organizations set public_enabled = true where name = 'Ward Café' $$,
  '23514', null, 'a public page needs an address'
);
update public.organizations set public_slug = 'ward-cafe', public_enabled = true where name = 'Ward Café';

-- ───── The directory and the page are public ─────
set local role anon;
select is((public.get_score_directory() -> 'businesses')::int, 1, 'only businesses with a public page are listed');
select is((public.get_score_directory() -> 'results' -> 0 -> 'slug') #>> '{}', 'ward-cafe', 'the listing links to the page');
select is(public.get_score_directory() -> 'results' -> 0 -> 'score', 'null'::jsonb, 'no score before 25 ratings');
select is((public.get_score_profile('ward-cafe') -> 'ratings')::int, 24, 'the page counts every rating of the year');
select is(public.get_score_profile('ward-cafe') -> 'score', 'null'::jsonb, 'the page shows no score before 25 ratings');
select is(public.get_score_profile('quiet-gym'), null, 'no page for a business that did not turn it on');
select is((public.get_score_reviews('ward-cafe') -> 'total')::int, 0, 'no comment is public without the customer''s consent');
reset role;

insert into public.survey_responses (organization_id, survey_id, survey_version_id, location_id, submission_id, locale, csat_score, has_comment, comment_text)
select org, survey, version, location, '99999999-0000-0000-0000-000000000001', 'ar', 4, true, 'القهوة ممتازة'
from ids;

set local role anon;
select is((public.get_score_profile('ward-cafe') ->> 'score')::numeric, 4.5, 'the score is the average rating, one decimal');
select is(public.get_score_profile('WARD-CAFE') -> 'distribution', '[0, 4, 0, 1, 20]'::jsonb, 'stars from one to five; the address ignores case');
select is((public.get_score_badge('ward-cafe') ->> 'satisfied')::int, 21, 'the badge counts satisfied customers');
select throws_ok($$ select public.publish_review('99999999-0000-0000-0000-000000000001', 'Noura') $$, '42501', null, 'visitors cannot publish reviews directly');
reset role;

-- ───── Consent from the thank-you screen (through the server) ─────
set local role service_role;
select ok(public.can_publish_review('99999999-0000-0000-0000-000000000001'), 'the thank-you screen may offer to publish');
select ok(public.publish_review('99999999-0000-0000-0000-000000000001', '  Noura  '), 'the customer agrees');
select ok(not public.publish_review('99999999-0000-0000-0000-000000000001', 'Noura'), 'only once');
reset role;

set local role anon;
select is(public.get_score_reviews('ward-cafe') -> 'items' -> 0 ->> 'name', 'Noura', 'published under the first name the customer typed');
select is((public.get_score_reviews('ward-cafe', 5::smallint) -> 'total')::int, 0, 'filters by stars');
reset role;

-- ───── Public replies ─────
set local role authenticated;
select pg_temp.act_as('cccccccc-0000-0000-0000-00000000000c');
update public.survey_responses set public_reply = 'شكرًا' where submission_id = '99999999-0000-0000-0000-000000000001';
reset role;
select is((select public_reply from public.survey_responses where submission_id = '99999999-0000-0000-0000-000000000001'), null, 'viewers cannot answer reviews');

set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
update public.survey_responses set public_reply = 'شكرًا يا نورة' where submission_id = '99999999-0000-0000-0000-000000000001';
select throws_ok(
  $$ update public.survey_responses set public_reply = 'x' where comment_text = 'تعليق 1' $$,
  'P0001', 'not_published', 'only published reviews get a public answer'
);
select throws_ok(
  $$ update public.survey_responses set publish_consent = false where submission_id = '99999999-0000-0000-0000-000000000001' $$,
  '42501', null, 'the business cannot unpublish a review'
);
reset role;

set local role anon;
select is(public.get_score_reviews('ward-cafe') -> 'items' -> 0 ->> 'reply', 'شكرًا يا نورة', 'the answer shows under the review');
select isnt(public.get_score_reviews('ward-cafe') -> 'items' -> 0 ->> 'replyAt', null, 'with its time');
reset role;

select * from finish();
rollback;
