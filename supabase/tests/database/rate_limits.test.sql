begin;
select plan(6);

set local role service_role;
select ok(public.consume_rate_limit('test:a', 2, 60), 'first hit is allowed');
select ok(public.consume_rate_limit('test:a', 2, 60), 'second hit is allowed');
select ok(not public.consume_rate_limit('test:a', 2, 60), 'third hit is over the limit');
select ok(public.consume_rate_limit('test:b', 2, 60), 'other keys are counted separately');
reset role;

set local role anon;
select throws_ok($$select public.consume_rate_limit('test:a', 2, 60)$$, '42501', null, 'anonymous visitors cannot call the limiter');
reset role;

set local role authenticated;
select throws_ok($$select public.consume_rate_limit('test:a', 2, 60)$$, '42501', null, 'signed-in users cannot call the limiter');
reset role;

select * from finish();
rollback;
