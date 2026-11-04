begin;
select plan(12);

-- Two users signing up with different metadata.
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'nora@example.com', '{"full_name": "  Nora Alharbi ", "locale": "en"}'),
  ('22222222-2222-2222-2222-222222222222', 'faisal@example.com', '{"locale": "fr"}');

select has_table('public', 'profiles', 'profiles table exists');
select is(
  (select count(*)::int from public.profiles), 2,
  'a profile is created for each new user'
);
select is(
  (select full_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'Nora Alharbi',
  'name from sign-up metadata is trimmed'
);
select is(
  (select locale::text from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'en',
  'requested language is stored'
);
select is(
  (select locale::text from public.profiles where id = '22222222-2222-2222-2222-222222222222'), 'ar',
  'unsupported language falls back to Arabic'
);

-- As Nora.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);

select is(
  (select count(*)::int from public.profiles), 1,
  'a user sees only their own profile'
);

update public.profiles set locale = 'ar' where id = '11111111-1111-1111-1111-111111111111';
select is(
  (select locale::text from public.profiles where id = '11111111-1111-1111-1111-111111111111'), 'ar',
  'a user can change their own language'
);

update public.profiles set full_name = 'Hijacked' where id = '22222222-2222-2222-2222-222222222222';
reset role;
select is(
  (select full_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'), null,
  'a user cannot update another user''s profile'
);
set local role authenticated;

select throws_ok(
  $$update public.profiles set id = '33333333-3333-3333-3333-333333333333' where id = '11111111-1111-1111-1111-111111111111'$$,
  '42501', null,
  'a user cannot change protected columns'
);

select throws_ok(
  $$insert into public.profiles (id) values ('11111111-1111-1111-1111-111111111111')$$,
  '42501', null,
  'a user cannot insert profiles directly'
);

-- As an anonymous visitor.
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok(
  $$select * from public.profiles$$,
  '42501', null,
  'anonymous visitors have no access to profiles'
);

reset role;
delete from auth.users where id = '22222222-2222-2222-2222-222222222222';
select is(
  (select count(*)::int from public.profiles where id = '22222222-2222-2222-2222-222222222222'), 0,
  'deleting the auth user deletes the profile'
);

select * from finish();
rollback;
