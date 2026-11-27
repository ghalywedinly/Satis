-- Satis Score: the public side of a business's ratings.
--   * A business can turn on a public page at satis-app.com/score/<slug>.
--   * Its score is the average CSAT rating of the last 12 months, shown only from 25 ratings.
--   * A customer's written comment is published only when the customer agreed to it on the
--     thank-you screen, under the first name they typed (or none).
--   * The business can answer a published review in public, but cannot hide it. Only the
--     Satis team can hide a review (public_hidden_at, no grant).
-- The public reads go through security-definer functions that return only what the page shows.

alter table public.organizations
  add column public_enabled boolean not null default false,
  add column public_reviews_enabled boolean not null default true,
  add column public_slug text unique
    check (public_slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(public_slug) between 3 and 40),
  add column public_about text check (char_length(public_about) <= 280),
  add column public_website text check (char_length(public_website) <= 120 and public_website ~ '^[a-z0-9.-]+\.[a-z]{2,}(/\S*)?$'),
  add constraint organizations_public_needs_slug check (not public_enabled or public_slug is not null);

grant update (public_enabled, public_reviews_enabled, public_slug, public_about, public_website) on public.organizations to authenticated;

alter table public.survey_responses
  add column publish_consent boolean not null default false,
  add column reviewer_name text check (char_length(reviewer_name) between 1 and 40),
  add column public_reply text check (char_length(btrim(public_reply)) between 1 and 1000),
  add column public_reply_at timestamptz,
  add column public_hidden_at timestamptz;

create index survey_responses_published_idx on public.survey_responses (organization_id, submitted_at desc)
where publish_consent and public_hidden_at is null;

-- Staff answer reviews like they triage them (same update policy); the time is set here.
grant update (public_reply) on public.survey_responses to authenticated;

create function private.stamp_public_reply()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.public_reply is distinct from old.public_reply then
    if new.public_reply is not null and not new.publish_consent then
      raise exception 'not_published' using errcode = 'P0001';
    end if;
    new.public_reply_at := case when new.public_reply is null then null else now() end;
  end if;
  return new;
end;
$$;

create trigger survey_responses_stamp_public_reply before update of public_reply on public.survey_responses
for each row execute function private.stamp_public_reply();

-- ───────── Public reads ─────────

-- The smallest number of ratings before a score is shown.
create function private.score_min_ratings()
returns integer
language sql
immutable
set search_path = ''
as $$ select 25 $$;

-- Businesses with a public page, best rated first. Optional name search and business type.
create function public.get_score_directory(
  p_query text default null,
  p_type public.business_type default null,
  p_limit integer default 30
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with orgs as (
    select o.id, o.name, o.public_slug, o.business_type
    from public.organizations o
    where o.public_enabled
  ),
  stats as (
    select r.organization_id, count(*) as n, count(*) filter (where r.csat_score >= 4) as satisfied, avg(r.csat_score) as average
    from public.survey_responses r
    join orgs on orgs.id = r.organization_id
    where r.csat_score is not null and r.submitted_at >= now() - interval '12 months'
    group by r.organization_id
  ),
  cities as (
    select l.organization_id, array_agg(distinct l.city order by l.city) as list
    from public.locations l
    join orgs on orgs.id = l.organization_id
    where l.archived_at is null and nullif(btrim(l.city), '') is not null
    group by l.organization_id
  ),
  listed as (
    select orgs.*, coalesce(s.n, 0) as n, coalesce(s.satisfied, 0) as satisfied, s.average, coalesce(c.list, '{}') as cities
    from orgs
    left join stats s on s.organization_id = orgs.id
    left join cities c on c.organization_id = orgs.id
  )
  select jsonb_build_object(
    'ratings', (select coalesce(sum(n), 0) from listed),
    'businesses', (select count(*) from listed),
    'cities', (select count(distinct city) from listed, unnest(cities) as city),
    'types', (select coalesce(jsonb_object_agg(business_type, n), '{}') from (select business_type, count(*) as n from listed group by business_type) t),
    'results', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'slug', public_slug,
        'name', name,
        'type', business_type,
        'cities', to_jsonb(cities[1:2]),
        'ratings', n,
        'satisfied', satisfied,
        'score', case when n >= private.score_min_ratings() then round(average, 1) end
      ) order by (n >= private.score_min_ratings()) desc, average desc nulls last, n desc, name), '[]')
      from (
        select * from listed
        where (p_type is null or business_type = p_type)
          and (nullif(btrim(p_query), '') is null or position(lower(btrim(p_query)) in lower(name)) > 0)
        order by (n >= private.score_min_ratings()) desc, average desc nulls last, n desc, name
        limit least(greatest(coalesce(p_limit, 30), 1), 60)
      ) r
    )
  );
$$;

-- One business's public page: score, distribution, the year month by month, branches and
-- how often low ratings get a public answer. Null when the page is off or doesn't exist.
create function public.get_score_profile(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with org as (
    select o.id, o.name, o.business_type, o.public_about, o.public_website, o.public_reviews_enabled, o.created_at
    from public.organizations o
    where o.public_enabled and o.public_slug = lower(p_slug)
  ),
  rated as (
    select r.csat_score, r.submitted_at, r.location_id, r.publish_consent, r.public_hidden_at, r.public_reply, r.comment_text
    from public.survey_responses r
    join org on org.id = r.organization_id
    where r.csat_score is not null and r.submitted_at >= now() - interval '12 months'
  ),
  published as (
    select * from rated
    where publish_consent and public_hidden_at is null and comment_text is not null
      and (select public_reviews_enabled from org)
  ),
  months as (
    select date_trunc('month', m)::date as month
    from generate_series(date_trunc('month', now()) - interval '11 months', date_trunc('month', now()), interval '1 month') as m
  )
  select case when exists (select 1 from org) then jsonb_build_object(
    'name', org.name,
    'type', org.business_type,
    'about', org.public_about,
    'website', org.public_website,
    'since', extract(year from org.created_at)::int,
    'minRatings', private.score_min_ratings(),
    'ratings', (select count(*) from rated),
    'score', (select case when count(*) >= private.score_min_ratings() then round(avg(csat_score), 1) end from rated),
    'satisfied', (select count(*) from rated where csat_score >= 4),
    'distribution', (select jsonb_agg((select count(*) from rated where csat_score = s) order by s) from generate_series(1, 5) as s),
    'months', (
      select jsonb_agg(jsonb_build_object(
        'month', months.month,
        'ratings', (select count(*) from rated where date_trunc('month', submitted_at)::date = months.month),
        'score', (select round(avg(csat_score), 2) from rated where date_trunc('month', submitted_at)::date = months.month)
      ) order by months.month)
      from months
    ),
    'locations', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', l.name,
        'city', l.city,
        'ratings', (select count(*) from rated where location_id = l.id),
        'score', (select case when count(*) >= 5 then round(avg(csat_score), 1) end from rated where location_id = l.id)
      ) order by l.created_at), '[]')
      from public.locations l
      where l.organization_id = org.id and l.archived_at is null
    ),
    'reviews', (select count(*) from published),
    'lowReviews', (select count(*) from published where csat_score <= 3),
    'lowAnswered', (select count(*) from published where csat_score <= 3 and public_reply is not null)
  ) end
  from org;
$$;

-- Published reviews of one business, newest first, optionally of one star rating.
create function public.get_score_reviews(
  p_slug text,
  p_stars smallint default null,
  p_offset integer default 0,
  p_limit integer default 10
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  with published as (
    select r.id, r.csat_score, r.reviewer_name, r.comment_text, r.submitted_at, r.public_reply, r.public_reply_at,
      l.name as location, l.city
    from public.survey_responses r
    join public.organizations o on o.id = r.organization_id
    join public.locations l on l.id = r.location_id
    where o.public_enabled and o.public_reviews_enabled and o.public_slug = lower(p_slug)
      and r.publish_consent and r.public_hidden_at is null
      and r.comment_text is not null and r.csat_score is not null
      and (p_stars is null or r.csat_score = p_stars)
  )
  select jsonb_build_object(
    'total', (select count(*) from published),
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'id', id, 'rating', csat_score, 'name', reviewer_name, 'comment', comment_text, 'at', submitted_at,
        'location', location, 'city', city, 'reply', public_reply, 'replyAt', public_reply_at
      ) order by submitted_at desc, id), '[]')
      from (
        select * from published
        order by submitted_at desc, id
        offset greatest(coalesce(p_offset, 0), 0)
        limit least(greatest(coalesce(p_limit, 10), 1), 30)
      ) page
    )
  );
$$;

-- What the website badge shows. Null when the page is off.
create function public.get_score_badge(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', o.name,
    'ratings', count(r.id),
    'satisfied', count(r.id) filter (where r.csat_score >= 4),
    'score', case when count(r.id) >= private.score_min_ratings() then round(avg(r.csat_score), 1) end
  )
  from public.organizations o
  left join public.survey_responses r
    on r.organization_id = o.id and r.csat_score is not null and r.submitted_at >= now() - interval '12 months'
  where o.public_enabled and o.public_slug = lower(p_slug)
  group by o.id;
$$;

-- ───────── Customer consent ─────────

-- Whether the thank-you screen should offer to publish this response's comment.
create function public.can_publish_review(p_submission_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.survey_responses r
    join public.organizations o on o.id = r.organization_id
    where r.submission_id = p_submission_id
      and o.public_enabled and o.public_reviews_enabled
      and r.comment_text is not null and r.csat_score is not null
      and not r.publish_consent
      and r.submitted_at >= now() - interval '1 day'
  );
$$;

-- The customer agreed on the thank-you screen. The submission id, generated in their browser,
-- is the proof it's their own response; only within a day of answering. Called by the server.
create function public.publish_review(p_submission_id uuid, p_name text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(btrim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')), '');
begin
  if not public.can_publish_review(p_submission_id) then
    return false;
  end if;
  if char_length(v_name) > 40 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;
  update public.survey_responses
  set publish_consent = true, reviewer_name = v_name
  where submission_id = p_submission_id;
  return true;
end;
$$;

revoke all on function
  public.get_score_directory(text, public.business_type, integer),
  public.get_score_profile(text),
  public.get_score_reviews(text, smallint, integer, integer),
  public.get_score_badge(text),
  public.can_publish_review(uuid),
  public.publish_review(uuid, text),
  private.score_min_ratings()
from public, anon, authenticated;

grant execute on function
  public.get_score_directory(text, public.business_type, integer),
  public.get_score_profile(text),
  public.get_score_reviews(text, smallint, integer, integer),
  public.get_score_badge(text)
to anon, authenticated;

grant execute on function public.can_publish_review(uuid), public.publish_review(uuid, text) to service_role;
