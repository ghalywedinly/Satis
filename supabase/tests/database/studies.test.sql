begin;
select plan(20);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'owner@example.com'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'outsider@example.com'),
  ('cccccccc-0000-0000-0000-00000000000c', 'staff@example.com');

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;
grant execute on function pg_temp.act_as(uuid) to authenticated;

set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.create_organization('Wellness Lab', 'clinic', 'ar', 'Jeddah');
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select public.create_organization('Other Gym', 'gym', 'en', 'Riyadh');
reset role;

insert into public.organization_members (organization_id, user_id, role)
select id, 'cccccccc-0000-0000-0000-00000000000c', 'staff' from public.organizations where name = 'Wellness Lab';
create temp table ids as select
  (select id from public.organizations where name = 'Wellness Lab') as org,
  (select id from public.locations where name = 'Jeddah') as loc;
grant select on ids to authenticated;

create temp table q as select '[
  {"id": "11111111-1111-1111-1111-111111111111", "type": "rating", "required": true, "title": {"ar": "مستوى معرفتك", "en": "Your knowledge"}},
  {"id": "55555555-5555-5555-5555-555555555555", "type": "text", "required": false, "title": {"ar": "ملاحظات", "en": "Comments"}}
]'::jsonb as questions;
grant select on q to authenticated;

create function pg_temp.new_study(name text, match boolean) returns uuid language sql as $$
  select public.create_study((select org from ids), name, 'Training effect', match, name || ' · pre', name || ' · post',
    '{ar,en}', 'ar', (select questions from q), '{}'::jsonb, '{}'::jsonb);
$$;
grant execute on function pg_temp.new_study(text, boolean) to authenticated;

-- ───── Creating ─────
set local role authenticated;
select pg_temp.act_as('cccccccc-0000-0000-0000-00000000000c');
select throws_ok($$select pg_temp.new_study('Staff study', true)$$, 'P0001', 'forbidden', 'staff cannot create studies');
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select throws_ok($$select pg_temp.new_study('Outsider study', true)$$, 'P0001', 'forbidden', 'outsiders cannot create studies in another business');

select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select lives_ok($$select pg_temp.new_study('Workshop', true)$$, 'managers and above can create a study');
select is(
  (select array_agg(study_phase order by study_phase) from public.surveys where study_id = (select id from public.studies where name = 'Workshop')),
  '{post,pre}'::text[], 'a study gets a pre-survey and a post-survey'
);
select is(
  (select count(distinct questions)::int from public.surveys where study_id = (select id from public.studies where name = 'Workshop')),
  1, 'both surveys start with the same questions'
);
select throws_ok(
  $$update public.surveys set study_id = null where study_phase = 'pre'$$,
  '42501', null, 'a survey cannot be moved out of its study'
);
select lives_ok($$select pg_temp.new_study('Open feedback', false)$$, 'a study can skip participant codes');
reset role;

-- Publish every study survey and give each one a link.
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
set local role authenticated;
select public.publish_survey(id) from public.surveys where study_id is not null;
reset role;
insert into public.survey_links (organization_id, survey_id, location_id, public_code)
select s.organization_id, s.id, (select loc from ids),
  case when st.name = 'Workshop' then 'Work' else 'Open' end || initcap(s.study_phase) || 'Code1'
from public.surveys s join public.studies st on st.id = s.study_id;
create temp table v as select public_code as code, s.current_version_id as version
from public.survey_links l join public.surveys s on s.id = l.survey_id;
grant select on v to service_role;

-- ───── Answering ─────
select is(
  (select public.get_public_survey('WorkPreCode1') -> 'study'),
  '{"phase": "pre", "matchParticipants": true}'::jsonb,
  'the public survey says it is the pre-survey and asks for a participant code'
);
set local role service_role;
select throws_ok(
  $$select public.submit_survey_response('WorkPreCode1', (select version from v where code = 'WorkPreCode1'),
      '99999999-0000-0000-0000-000000000001', 'ar', '{"11111111-1111-1111-1111-111111111111": {"number": 2}}', 'mobile')$$,
  'P0001', 'invalid_participant', 'a participant code is required when the study matches participants'
);
select lives_ok(
  $$select public.submit_survey_response('WorkPreCode1', (select version from v where code = 'WorkPreCode1'),
      '99999999-0000-0000-0000-000000000002', 'ar', '{"11111111-1111-1111-1111-111111111111": {"number": 2}}', 'mobile', ' p-014 ')$$,
  'a participant answers the pre-survey with their code'
);
select throws_ok(
  $$select public.submit_survey_response('WorkPreCode1', (select version from v where code = 'WorkPreCode1'),
      '99999999-0000-0000-0000-000000000003', 'ar', '{"11111111-1111-1111-1111-111111111111": {"number": 3}}', 'mobile', 'P-014')$$,
  'P0001', 'already_answered', 'the same code cannot answer the same survey twice'
);
select lives_ok(
  $$select public.submit_survey_response('WorkPostCode1', (select version from v where code = 'WorkPostCode1'),
      '99999999-0000-0000-0000-000000000004', 'ar', '{"11111111-1111-1111-1111-111111111111": {"number": 5}}', 'mobile', 'P-014')$$,
  'the same code answers the post-survey'
);
select throws_ok(
  $$select public.submit_survey_response('WorkPostCode1', (select version from v where code = 'WorkPostCode1'),
      '99999999-0000-0000-0000-000000000005', 'ar', '{"11111111-1111-1111-1111-111111111111": {"number": 5}}', 'mobile', 'P 014!')$$,
  'P0001', 'invalid_participant', 'codes use letters, digits, dashes and underscores only'
);
select lives_ok(
  $$select public.submit_survey_response('OpenPreCode1', (select version from v where code = 'OpenPreCode1'),
      '99999999-0000-0000-0000-000000000006', 'ar', '{"11111111-1111-1111-1111-111111111111": {"number": 4}}', 'mobile')$$,
  'studies that do not match participants need no code'
);
reset role;
select is(
  (select array_agg(participant_code order by submitted_at) from public.survey_responses where participant_code is not null),
  '{P-014,P-014}'::text[], 'codes are stored trimmed and upper-case'
);

-- ───── Reading the results ─────
set local role authenticated;
select pg_temp.act_as('cccccccc-0000-0000-0000-00000000000c');
select is(
  jsonb_array_length(public.get_study_responses((select id from public.studies where name = 'Workshop'))),
  2, 'members read every response of the study, before and after'
);
select is(
  public.get_study_responses((select id from public.studies where name = 'Workshop')) -> 1 -> 'answers' -> '11111111-1111-1111-1111-111111111111' -> 'number',
  '5'::jsonb, 'with their answers'
);
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select is(
  jsonb_array_length(public.get_study_responses((select id from public.studies where name = 'Workshop'))),
  0, 'other businesses read nothing'
);
reset role;

-- ───── Survey design ─────
set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select lives_ok(
  $$update public.surveys set theme = '{"accent": "custom", "accentColor": "#0F766E", "background": "custom", "backgroundColor": "#FFF7ED",
    "font": "cairo", "logo": {"src": "data:image/png;base64,iVBORw0KGgo=", "position": "start", "size": "md"}}' where study_phase = 'pre'$$,
  'a survey can use custom colours, a font and a logo'
);
select throws_ok(
  $$update public.surveys set theme = '{"accent": "custom", "accentColor": "red", "logo": {"src": "https://example.com/x.png"}}' where study_phase = 'pre'$$,
  '23514', null, 'colours must be hex and logos embedded images'
);
reset role;

select * from finish();
rollback;
