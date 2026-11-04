begin;
select plan(43);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'owner@example.com'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'outsider@example.com'),
  ('cccccccc-0000-0000-0000-00000000000c', 'viewer@example.com');

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;
grant execute on function pg_temp.act_as(uuid) to authenticated;

set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.create_organization('Nora Café', 'cafe', 'ar', 'Jeddah - Tahlia');
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select public.create_organization('Other Gym', 'gym', 'en', 'Riyadh');
reset role;

-- The viewer joins Nora Café; remember ids.
insert into public.organization_members (organization_id, user_id, role)
select id, 'cccccccc-0000-0000-0000-00000000000c', 'viewer' from public.organizations where name = 'Nora Café';
create temp table ids as select
  (select id from public.organizations where name = 'Nora Café') as org,
  (select id from public.organizations where name = 'Other Gym') as other_org,
  (select id from public.locations where name = 'Jeddah - Tahlia') as loc,
  (select id from public.locations where name = 'Riyadh') as other_loc;
grant select on ids to authenticated;

-- A two-question survey: a required CSAT rating and an optional comment, plus a choice question.
create temp table q as select '[
  {"id": "11111111-1111-1111-1111-111111111111", "type": "rating", "required": true, "role": "csat", "title": {"ar": "كيف كانت زيارتك؟", "en": "How was your visit?"}},
  {"id": "22222222-2222-2222-2222-222222222222", "type": "single_choice", "required": false, "title": {"ar": "ما الذي أعجبك؟", "en": "What did you like?"},
   "options": [{"id": "33333333-3333-3333-3333-333333333333", "label": {"ar": "الخدمة", "en": "Service"}},
               {"id": "44444444-4444-4444-4444-444444444444", "label": {"ar": "السعر", "en": "Price"}}]},
  {"id": "55555555-5555-5555-5555-555555555555", "type": "text", "required": false, "title": {"ar": "ملاحظات", "en": "Comments"}}
]'::jsonb as questions;
grant select on q to authenticated;

-- ───── Creating and editing ─────
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select lives_ok(
  $$insert into public.surveys (organization_id, name, locales, default_locale) values ((select org from ids), 'Post-visit', '{ar,en}', 'ar')$$,
  'managers and above can create surveys'
);
select throws_ok(
  format('select public.publish_survey(%L)', (select id from public.surveys where name = 'Post-visit')),
  'P0001', 'invalid_survey', 'a survey without questions cannot be published'
);
update public.surveys set questions = (select questions from q) where name = 'Post-visit';
select lives_ok(
  format('select public.publish_survey(%L)', (select id from public.surveys where name = 'Post-visit')),
  'a survey with questions can be published'
);
select is((select status::text from public.surveys where name = 'Post-visit'), 'published', 'publishing makes it live');
select is((select version from public.survey_versions), 1, 'the first publish creates version 1');
select ok(not (select has_unpublished_changes from public.surveys where name = 'Post-visit'), 'nothing is pending right after publishing');
update public.surveys set thank_you = '{"ar": "شكرًا", "en": "Thanks"}' where name = 'Post-visit';
select ok((select has_unpublished_changes from public.surveys where name = 'Post-visit'), 'editing a live survey marks unpublished changes');
select throws_ok(
  $$update public.surveys set status = 'archived' where name = 'Post-visit'$$,
  '42501', null, 'status can only change through the dedicated functions'
);
select lives_ok(
  $$insert into public.survey_links (organization_id, survey_id, location_id, public_code)
    values ((select org from ids), (select id from public.surveys where name = 'Post-visit'), (select loc from ids), 'NoraCode1')$$,
  'managers can create a link for their own location'
);
select throws_ok(
  $$insert into public.survey_links (organization_id, survey_id, location_id, public_code)
    values ((select org from ids), (select id from public.surveys where name = 'Post-visit'), (select other_loc from ids), 'Sneaky001')$$,
  'P0001', 'forbidden', 'a link cannot point at another business''s location'
);

-- ───── Isolation and roles ─────
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.surveys where organization_id = (select org from ids)), 0, 'outsiders cannot see surveys');
select is((select count(*)::int from public.survey_links where organization_id = (select org from ids)), 0, 'outsiders cannot see links');
select throws_ok(
  $$insert into public.surveys (organization_id, name) values ((select org from ids), 'Injected')$$,
  '42501', null, 'outsiders cannot create surveys in another business'
);
select throws_ok(
  format('select public.publish_survey(%L)', (select id from public.surveys where name = 'Post-visit')),
  'P0001', 'not_found', 'outsiders cannot publish another business''s survey'
);

select pg_temp.act_as('cccccccc-0000-0000-0000-00000000000c');
select is((select count(*)::int from public.surveys), 1, 'viewers can see their business''s surveys');
select throws_ok(
  $$insert into public.surveys (organization_id, name) values ((select org from ids), 'Viewer survey')$$,
  '42501', null, 'viewers cannot create surveys'
);
select throws_ok(
  format('select public.publish_survey(%L)', (select id from public.surveys where name = 'Post-visit')),
  'P0001', 'forbidden', 'viewers cannot publish'
);
update public.surveys set name = 'Renamed by viewer' where name = 'Post-visit';
reset role;
select is((select count(*)::int from public.surveys where name = 'Post-visit'), 1, 'viewers cannot edit surveys');

-- ───── Public access ─────
create temp table v as select (select current_version_id from public.surveys where name = 'Post-visit') as id;
grant select on v to anon, service_role;
set local role anon;
select is(
  (select public.get_public_survey('NoraCode1') ->> 'organizationName'), 'Nora Café',
  'anyone with the code can load a live survey'
);
select is(
  (select jsonb_array_length(public.get_public_survey('NoraCode1') -> 'definition' -> 'questions')), 3,
  'the public survey is the published version'
);
select is(public.get_public_survey('NoSuchCode'), null, 'unknown codes return nothing');
select throws_ok($$select * from public.surveys$$, '42501', null, 'anonymous visitors cannot read survey tables');
select throws_ok($$select * from public.survey_responses$$, '42501', null, 'anonymous visitors cannot read responses');
select throws_ok(
  format('select public.submit_survey_response(%L, %L, %L, %L, %L, %L)', 'NoraCode1', (select id from v), gen_random_uuid(), 'ar', '{}', 'mobile'),
  '42501', null, 'browsers cannot submit directly (only the rate-limited server can)'
);
reset role;

-- ───── Submitting (as the server) ─────
set local role service_role;

select isnt(
  public.submit_survey_response('NoraCode1', (select id from v), '99999999-0000-0000-0000-000000000001', 'ar',
    '{"11111111-1111-1111-1111-111111111111": {"number": 5},
      "22222222-2222-2222-2222-222222222222": {"options": ["33333333-3333-3333-3333-333333333333"]},
      "55555555-5555-5555-5555-555555555555": {"text": "  خدمة ممتازة  "}}', 'mobile'),
  null, 'a complete response is accepted'
);
select is(
  public.submit_survey_response('NoraCode1', (select id from v), '99999999-0000-0000-0000-000000000001', 'ar',
    '{"11111111-1111-1111-1111-111111111111": {"number": 5}}', 'mobile'),
  (select id from public.survey_responses where submission_id = '99999999-0000-0000-0000-000000000001'),
  'submitting twice (retry or double tap) returns the same response'
);
select is((select count(*)::int from public.survey_responses), 1, 'duplicates are not stored');
select is((select csat_score::int from public.survey_responses), 5, 'the CSAT score is stored on the response');
select ok((select has_comment from public.survey_responses), 'responses with comments are flagged');
select is((select value_text from public.survey_answers where value_text is not null), 'خدمة ممتازة', 'comments are trimmed');

create function pg_temp.submit(answers text) returns uuid language sql as $$
  select public.submit_survey_response('NoraCode1', (select id from v), gen_random_uuid(), 'en', answers::jsonb, 'desktop');
$$;
grant execute on function pg_temp.submit(text) to service_role;

select lives_ok($$select pg_temp.submit('{"11111111-1111-1111-1111-111111111111": {"number": 3}}')$$, 'optional questions can be skipped');
select throws_ok($$select pg_temp.submit('{}')$$, 'P0001', 'missing_answer', 'required questions must be answered');
select throws_ok($$select pg_temp.submit('{"11111111-1111-1111-1111-111111111111": {"number": 6}}')$$, 'P0001', 'invalid_answer', 'ratings must be 1 to 5');
select throws_ok($$select pg_temp.submit('{"11111111-1111-1111-1111-111111111111": {"number": 3.5}}')$$, 'P0001', 'invalid_answer', 'ratings must be whole numbers');
select throws_ok(
  $$select pg_temp.submit('{"11111111-1111-1111-1111-111111111111": {"number": 4}, "22222222-2222-2222-2222-222222222222": {"options": ["77777777-7777-7777-7777-777777777777"]}}')$$,
  'P0001', 'invalid_answer', 'choices must come from the question''s options'
);
select throws_ok(
  $$select pg_temp.submit('{"11111111-1111-1111-1111-111111111111": {"number": 4}, "22222222-2222-2222-2222-222222222222": {"options": ["33333333-3333-3333-3333-333333333333", "44444444-4444-4444-4444-444444444444"]}}')$$,
  'P0001', 'invalid_answer', 'single-choice questions take one option'
);
select throws_ok(
  $$select pg_temp.submit('{"11111111-1111-1111-1111-111111111111": {"number": 4}, "66666666-6666-6666-6666-666666666666": {"text": "extra"}}')$$,
  'P0001', 'invalid_answer', 'answers to unknown questions are rejected'
);
select throws_ok(
  format('select public.submit_survey_response(%L, %L, %L, %L, %L, %L)', 'NoraCode1', gen_random_uuid(), gen_random_uuid(), 'ar', '{"11111111-1111-1111-1111-111111111111": {"number": 4}}', 'mobile'),
  'P0001', 'survey_changed', 'answers to an outdated version are rejected'
);
reset role;

-- ───── Pausing and reading ─────
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.set_survey_status((select id from public.surveys where name = 'Post-visit'), 'paused');
set local role anon;
select is(public.get_public_survey('NoraCode1'), null, 'paused surveys are not shown to customers');
set local role service_role;
select throws_ok($$select pg_temp.submit('{"11111111-1111-1111-1111-111111111111": {"number": 4}}')$$, 'P0001', 'survey_unavailable', 'paused surveys accept no responses');

set local role authenticated;
select pg_temp.act_as('cccccccc-0000-0000-0000-00000000000c');
select is((select count(*)::int from public.survey_responses), 2, 'every member can read their business''s responses');
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.survey_responses), 0, 'outsiders cannot read responses');
select is((select count(*)::int from public.survey_answers), 0, 'outsiders cannot read answers');

select * from finish();
rollback;
