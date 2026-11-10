begin;
select plan(10);

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-00000000000a', 'team@satis.example'),
  ('bbbbbbbb-0000-0000-0000-00000000000b', 'owner@example.com');
insert into public.platform_admins (user_id) values ('aaaaaaaa-0000-0000-0000-00000000000a');

insert into public.meeting_requests (starts_at, full_name, email, phone, company)
values ('2026-11-15 08:00:00+00', 'Rakan Alotaibi', 'rakan@example.com', '+966551234567', 'Qahwa House');

create function pg_temp.act_as(user_id uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;
grant execute on function pg_temp.act_as(uuid) to authenticated;

set local role authenticated;
select pg_temp.act_as('bbbbbbbb-0000-0000-0000-00000000000b');
select ok(not public.is_platform_admin(), 'business owners are not the Satis team');
select is_empty($$select * from public.meeting_requests$$, 'they cannot see bookings');
update public.meeting_requests set status = 'confirmed';
select pg_temp.act_as('aaaaaaaa-0000-0000-0000-00000000000a');
select is((select status from public.meeting_requests), 'new', 'nor change them');

select ok(public.is_platform_admin(), 'the Satis team is recognised');
select is((select count(*)::int from public.meeting_requests), 1, 'the Satis team sees bookings');
select lives_ok(
  $$update public.meeting_requests set status = 'confirmed', meeting_link = 'https://meet.google.com/abc-defg-hij', notes = 'Three branches'$$,
  'and confirms them with a link and notes'
);
select throws_ok($$update public.meeting_requests set status = 'maybe'$$, '23514', null, 'only known statuses');
select throws_ok($$update public.meeting_requests set meeting_link = 'javascript:alert(1)'$$, '23514', null, 'links must be https');
select throws_ok($$update public.meeting_requests set email = 'x@example.com'$$, '42501', null, 'visitor details cannot be edited');
update public.meeting_requests set status = 'cancelled';
reset role;

select is(
  (select count(*)::int from public.booked_meeting_slots('2026-11-15', '2026-11-16')),
  0, 'a cancelled booking frees its time for other visitors'
);

select * from finish();
rollback;
