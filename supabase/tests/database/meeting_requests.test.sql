begin;
select plan(9);

insert into public.meeting_requests (starts_at, full_name, email, phone, company, locale)
values ('2026-11-01 07:00:00+00', 'Rakan Alotaibi', 'rakan@example.com', '+966551234567', 'Qahwa House', 'ar');

select throws_ok(
  $$insert into public.meeting_requests (starts_at, full_name, email, phone, company)
    values ('2026-11-01 07:00:00+00', 'Lina Haddad', 'lina@example.com', '+966559876543', 'Bloom')$$,
  '23505', null, 'a slot can be booked only once'
);
select throws_ok(
  $$insert into public.meeting_requests (starts_at, full_name, email, phone, company)
    values ('2026-11-01 07:15:00+00', 'Lina Haddad', 'lina@example.com', '+966559876543', 'Bloom')$$,
  '23514', null, 'slots start on the hour or half hour'
);
select throws_ok(
  $$insert into public.meeting_requests (starts_at, full_name, email, phone, company)
    values ('2026-11-01 08:00:00+00', 'Lina Haddad', 'lina@example.com', '0559876543', 'Bloom')$$,
  '23514', null, 'phone numbers are stored in international form'
);

set local role anon;
select throws_ok($$select * from public.meeting_requests$$, '42501', null, 'visitors cannot read bookings');
select throws_ok(
  $$insert into public.meeting_requests (starts_at, full_name, email, phone, company)
    values ('2026-11-01 08:00:00+00', 'Lina Haddad', 'lina@example.com', '+966559876543', 'Bloom')$$,
  '42501', null, 'visitors cannot book directly, only through the server'
);
select results_eq(
  $$select * from public.booked_meeting_slots('2026-11-01', '2026-11-02')$$,
  $$values ('2026-11-01 07:00:00+00'::timestamptz)$$,
  'the booking page sees which times are taken'
);
select is_empty(
  $$select * from public.booked_meeting_slots('2026-01-01', '2026-12-31')$$,
  'the window is limited to about two months'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', gen_random_uuid(), 'role', 'authenticated')::text, true);
select throws_ok($$select * from public.meeting_requests$$, '42501', null, 'signed-in teams cannot read bookings either');
reset role;

select ok(
  (select relrowsecurity from pg_class where oid = 'public.meeting_requests'::regclass),
  'row level security is on'
);

select * from finish();
rollback;
