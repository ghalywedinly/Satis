begin;
select plan(14);

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

insert into public.surveys (organization_id, name, locales, default_locale, questions)
select id, 'Post-visit', '{ar}', 'ar', '[
  {"id": "11111111-1111-1111-1111-111111111111", "type": "rating", "required": false, "role": "csat", "title": {"ar": "التقييم"}},
  {"id": "55555555-5555-5555-5555-555555555555", "type": "text", "required": false, "title": {"ar": "ملاحظات"}}
]'::jsonb from public.organizations where name = 'Nora Café';
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.publish_survey((select id from public.surveys where name = 'Post-visit'));
reset role;
insert into public.survey_links (organization_id, survey_id, location_id, public_code)
select s.organization_id, s.id, l.id, 'NoraCode1' from public.surveys s join public.locations l on l.organization_id = s.organization_id;

create temp table ids as select
  (select id from public.organizations where name = 'Nora Café') as org,
  (select current_version_id from public.surveys where name = 'Post-visit') as version;
grant select on ids to authenticated, service_role;

set local role service_role;
select public.submit_survey_response('NoraCode1', (select version from ids), '99999999-0000-0000-0000-000000000001', 'ar',
  '{"11111111-1111-1111-1111-111111111111": {"number": 2}, "55555555-5555-5555-5555-555555555555": {"text": "الانتظار طويل"}}', 'mobile');
select public.submit_survey_response('NoraCode1', (select version from ids), '99999999-0000-0000-0000-000000000002', 'ar',
  '{"11111111-1111-1111-1111-111111111111": {"number": 5}, "55555555-5555-5555-5555-555555555555": {"text": "موظفون لطفاء لكن الانتظار طويل"}}', 'mobile');
select public.submit_survey_response('NoraCode1', (select version from ids), '99999999-0000-0000-0000-000000000003', 'ar',
  '{"11111111-1111-1111-1111-111111111111": {"number": 4}}', 'mobile');

select is((select count(*)::int from public.ai_pending_comments(null, 10)), 2, 'only responses with written comments wait for analysis');

insert into public.response_analyses (organization_id, response_id, sentiment, complaint_themes, language, model, prompt_version)
select organization_id, id, 'negative', '{speed}', 'ar', 'test', 'v1' from public.survey_responses where submission_id = '99999999-0000-0000-0000-000000000001';
insert into public.response_analyses (organization_id, response_id, sentiment, praise_themes, complaint_themes, language, model, prompt_version)
select organization_id, id, 'mixed', '{staff}', '{speed}', 'ar', 'test', 'v1' from public.survey_responses where submission_id = '99999999-0000-0000-0000-000000000002';

select is((select count(*)::int from public.ai_pending_comments((select org from ids), 10)), 0, 'analysed comments are not picked up again');
select is((select themes from public.response_analyses where sentiment = 'mixed'), '{staff,speed}'::text[], 'themes combine praise and complaints');

create temp table obs as select public.ai_weekly_observed((select org from ids), now() - interval '7 days', now() + interval '1 minute') as j;
select is((select j ->> 'comments' from obs), '2', 'the summary counts analysed comments');
select is((select j -> 'complaints' -> 0 from obs), '{"theme": "speed", "mentions": 2}'::jsonb, 'complaints are counted per theme');
select is((select j -> 'complaintsByLocation' -> 0 ->> 'location' from obs), 'Tahlia', 'complaints are broken down by location');
select is((select j -> 'sentiment' from obs), '{"mixed": 1, "negative": 1}'::jsonb, 'sentiment is counted');

insert into public.ai_insights (organization_id, kind, period_start, period_end, observed, interpretation, model, prompt_version)
select org, 'weekly_summary', now() - interval '7 days', now(), '{}', '{"ar": {"headline": "الانتظار"}}', 'test', 'v1' from ids;
insert into public.ai_insight_evidence (organization_id, insight_id, response_id)
select r.organization_id, i.id, r.id from public.ai_insights i join public.survey_responses r on r.organization_id = i.organization_id where r.has_comment;
reset role;

-- ───── Access ─────
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select is((select count(*)::int from public.response_analyses), 2, 'members can read analyses');
select is((select count(*)::int from public.ai_insight_evidence), 2, 'members can read the evidence behind insights');
select is(
  public.get_theme_counts((select org from ids), now() - interval '1 day', now() + interval '1 minute'),
  '{"analysed": 2, "praise": {"staff": 1}, "complaints": {"speed": 2}}'::jsonb,
  'members can count themes'
);
select throws_ok(
  $$insert into public.response_analyses (organization_id, response_id, sentiment, model, prompt_version)
    select organization_id, id, 'positive', 'x', 'v1' from public.survey_responses limit 1$$,
  '42501', null, 'members cannot write analyses'
);
select throws_ok($$select * from public.ai_pending_comments(null, 10)$$, '42501', null, 'members cannot list other businesses'' pending comments');

select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select is((select count(*)::int from public.response_analyses) + (select count(*)::int from public.ai_insights), 0, 'outsiders see no analyses or insights');
select is(
  (public.get_theme_counts((select org from ids), now() - interval '1 day', now() + interval '1 minute') ->> 'analysed'),
  '0', 'outsiders count nothing in another business'
);
reset role;

select * from finish();
rollback;
