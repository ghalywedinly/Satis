begin;
select plan(25);

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
select public.create_organization('Nora Café', 'cafe', 'ar', 'Jeddah - Tahlia');
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select public.create_organization('Other Gym', 'gym', 'en', 'Riyadh');
reset role;

insert into public.organization_members (organization_id, user_id, role)
select id, 'cccccccc-0000-0000-0000-00000000000c'::uuid, 'viewer'::public.org_role from public.organizations where name = 'Nora Café'
union all
select id, 'dddddddd-0000-0000-0000-00000000000d'::uuid, 'staff'::public.org_role from public.organizations where name = 'Nora Café';

-- A live survey with a CSAT rating, an NPS question and a comment box.
insert into public.surveys (organization_id, name, locales, default_locale, questions)
select id, 'Post-visit', '{ar,en}', 'ar', '[
  {"id": "11111111-1111-1111-1111-111111111111", "type": "rating", "required": false, "role": "csat", "title": {"ar": "التقييم", "en": "Rating"}},
  {"id": "22222222-2222-2222-2222-222222222222", "type": "nps", "required": false, "title": {"ar": "التوصية", "en": "Recommend"}},
  {"id": "55555555-5555-5555-5555-555555555555", "type": "text", "required": false, "title": {"ar": "ملاحظات", "en": "Comments"}}
]'::jsonb from public.organizations where name = 'Nora Café';
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.publish_survey((select id from public.surveys where name = 'Post-visit'));
reset role;
insert into public.survey_links (organization_id, survey_id, location_id, public_code)
select s.organization_id, s.id, l.id, 'NoraCode1' from public.surveys s join public.locations l on l.organization_id = s.organization_id;

create temp table v as select (select current_version_id from public.surveys where name = 'Post-visit') as id;
grant select on v to service_role;

-- ───── Submitting fills the inbox fields ─────
set local role service_role;
select public.submit_survey_response('NoraCode1', (select id from v), '99999999-0000-0000-0000-000000000001', 'ar',
  '{"11111111-1111-1111-1111-111111111111": {"number": 2}, "55555555-5555-5555-5555-555555555555": {"text": "  الانتظار طويل  "}}', 'mobile');
select public.submit_survey_response('NoraCode1', (select id from v), '99999999-0000-0000-0000-000000000002', 'en',
  '{"22222222-2222-2222-2222-222222222222": {"number": 9}}', 'desktop');
select public.submit_survey_response('NoraCode1', (select id from v), '99999999-0000-0000-0000-000000000003', 'en',
  '{"11111111-1111-1111-1111-111111111111": {"number": 3}, "22222222-2222-2222-2222-222222222222": {"number": 10}}', 'desktop');
reset role;

create temp table r as select
  (select id from public.survey_responses where submission_id = '99999999-0000-0000-0000-000000000001') as low,
  (select id from public.survey_responses where submission_id = '99999999-0000-0000-0000-000000000002') as promoter,
  (select id from public.survey_responses where submission_id = '99999999-0000-0000-0000-000000000003') as mixed;
grant select on r to authenticated;

select is((select comment_text from public.survey_responses where id = (select low from r)), 'الانتظار طويل', 'the trimmed comment is copied onto the response');
select is((select comment_text from public.survey_responses where id = (select promoter from r)), null, 'responses without comments have none');
select is(
  (select array_agg(status::text || '/' || is_read::text || '/' || is_important::text) from public.survey_responses),
  '{new/false/false,new/false/false,new/false/false}', 'new responses start new, unread and not important'
);
select is((select rating_sentiment from public.survey_responses where id = (select low from r)), 'negative', 'a low rating reads as negative');
select is((select rating_sentiment from public.survey_responses where id = (select promoter from r)), 'positive', 'without a rating, an NPS promoter reads as positive');
select is((select rating_sentiment from public.survey_responses where id = (select mixed from r)), 'neutral', 'the CSAT rating wins over the NPS score');

-- ───── Triage ─────
set local role authenticated;
select pg_temp.act_as('dddddddd-0000-0000-0000-00000000000d');
select lives_ok(
  format('update public.survey_responses set status = %L, is_read = true, is_important = true where id = %L', 'in_progress', (select low from r)),
  'staff can triage responses'
);
select is(
  (select status::text || '/' || is_read::text || '/' || is_important::text from public.survey_responses where id = (select low from r)),
  'in_progress/true/true', 'triage changes are saved'
);
select throws_ok(
  format('update public.survey_responses set csat_score = 5 where id = %L', (select low from r)),
  '42501', null, 'nobody can change what the customer answered'
);
select throws_ok(
  format('update public.survey_responses set comment_text = %L where id = %L', 'edited', (select low from r)),
  '42501', null, 'nobody can change the customer''s comment'
);
select throws_ok(
  format('delete from public.survey_responses where id = %L', (select low from r)),
  '42501', null, 'responses cannot be deleted from the app'
);

-- ───── Tags ─────
select isnt(public.add_response_tag((select low from r), '  Waiting   time '), null, 'staff can tag a response with a new tag');
select is((select name from public.feedback_tags), 'Waiting time', 'tag names are tidied');
select is(public.add_response_tag((select mixed from r), 'waiting TIME'), (select id from public.feedback_tags), 'the same name in other letter case reuses the tag');
select lives_ok(format('select public.add_response_tag(%L, %L)', (select low from r), 'Waiting time'), 'tagging twice is harmless');
select is((select count(*)::int from public.response_tags), 2, 'each response holds the tag once');
select throws_ok(format('select public.add_response_tag(%L, %L)', (select low from r), '   '), 'P0001', 'invalid_tag', 'empty tag names are rejected');
select lives_ok(
  format('delete from public.response_tags where response_id = %L', (select mixed from r)),
  'staff can remove a tag from a response'
);

-- Viewers read but cannot triage.
select pg_temp.act_as('cccccccc-0000-0000-0000-00000000000c');
select is((select count(*)::int from public.response_tags), 1, 'viewers can see tags');
update public.survey_responses set is_important = false where id = (select low from r);
select throws_ok(format('select public.add_response_tag(%L, %L)', (select low from r), 'Price'), '42501', null, 'viewers cannot tag');
reset role;
select ok((select is_important from public.survey_responses where id = (select low from r)), 'viewers cannot triage');

-- ───── Isolation ─────
set local role authenticated;
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
update public.survey_responses set status = 'resolved';
select throws_ok(format('select public.add_response_tag(%L, %L)', (select low from r), 'Spam'), 'P0001', 'not_found', 'outsiders cannot tag another business''s responses');
select is((select count(*)::int from public.feedback_tags), 0, 'outsiders cannot see another business''s tags');
select throws_ok(
  format($$insert into public.response_tags (organization_id, response_id, tag_id)
    values ((select id from public.organizations where name = 'Other Gym'), %L, %L)$$, (select low from r), gen_random_uuid()),
  '23503', null, 'a tag cannot link records across businesses'
);
reset role;
select is((select count(*)::int from public.survey_responses where status = 'resolved'), 0, 'outsiders cannot triage another business''s responses');

select * from finish();
rollback;
