begin;
select plan(6);

insert into auth.users (id, email) values ('aaaaaaaa-0000-0000-0000-00000000000a', 'owner@example.com');

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;
grant execute on function pg_temp.act_as(uuid) to authenticated;

set local role authenticated;
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select public.create_organization('Nora Café', 'cafe', 'ar', 'Tahlia');
insert into public.surveys (organization_id, name, locales, default_locale, questions)
select id, 'Post-visit', '{ar}', 'ar', '[{"id": "11111111-1111-1111-1111-111111111111", "type": "rating", "required": true, "role": "csat", "title": {"ar": "التقييم"}}]'::jsonb
from public.organizations;

select is((select theme from public.surveys), '{}'::jsonb, 'new surveys use the default design');
select throws_ok(
  $$update public.surveys set theme = '{"accent": "pink"}'$$,
  '23514', null, 'only the brand accents are accepted'
);
select throws_ok(
  $$update public.surveys set theme = '{"ratingStyle": "thumbs"}'$$,
  '23514', null, 'only the known rating styles are accepted'
);

update public.surveys set theme = '{"accent": "ember", "background": "tint", "ratingStyle": "faces"}';
select public.publish_survey((select id from public.surveys));
select is(
  (select definition -> 'theme' from public.survey_versions),
  '{"accent": "ember", "background": "tint", "ratingStyle": "faces"}'::jsonb,
  'publishing freezes the design into the version'
);
select ok(not (select has_unpublished_changes from public.surveys), 'nothing is pending after publishing');
update public.surveys set theme = '{"accent": "mint", "background": "white", "ratingStyle": "stars"}';
select ok((select has_unpublished_changes from public.surveys), 'changing the design of a live survey is an unpublished change');
reset role;

select * from finish();
rollback;
